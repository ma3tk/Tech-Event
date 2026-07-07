"use client";

/**
 * 受付用 QR スキャナ (Client Component)。
 *
 * - `navigator.mediaDevices.getUserMedia` でカメラ映像を取得し、
 *   ブラウザ native の `BarcodeDetector` API で QR を読み取る (追加ライブラリ不使用)。
 * - 検出したトークンは Server Action `checkInByQrToken` に渡して署名検証 + チェックイン。
 * - `BarcodeDetector` 非対応ブラウザではカメラ UI を出さず、手動入力フォールバックのみ表示。
 * - カメラ権限拒否は inline メッセージで graceful に扱う (alert / dialog は出さない)。
 * - 手動入力フォームは常時表示 (カメラが使えない現場・E2E での検証経路)。
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  checkInByQrToken,
  type QrCheckInResult,
} from "@/app/actions/checkin-actions";

/* BarcodeDetector は TypeScript の DOM lib 未収録のため最小型を宣言する */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;
type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorCtor;
};

type ScanFeedback = { kind: "ok" | "already" | "error"; message: string };

function feedbackFor(result: QrCheckInResult): ScanFeedback {
  if (result.ok) {
    return result.alreadyAttended
      ? {
          kind: "already",
          message: `${result.participantName} さんは既にチェックイン済みです。`,
        }
      : {
          kind: "ok",
          message: `${result.participantName} さんをチェックインしました。`,
        };
  }
  switch (result.error) {
    case "invalid_token":
      return { kind: "error", message: "無効なトークンです (署名が一致しません)。" };
    case "wrong_event":
      return { kind: "error", message: "別のイベントのチケットです。" };
    case "not_accepted":
      return { kind: "error", message: "参加確定ステータスではないためチェックインできません。" };
    case "qr_disabled":
      return { kind: "error", message: "このイベントでは QR チェックインが無効です。" };
    case "forbidden":
      return { kind: "error", message: "チェックイン操作の権限がありません。" };
    case "not_logged_in":
      return { kind: "error", message: "ログインが必要です。" };
    default:
      return { kind: "error", message: "エラーが発生しました。" };
  }
}

/** useSyncExternalStore 用の no-op subscribe (値はマウント後に一度だけ確定する) */
const emptySubscribe = (): (() => void) => () => undefined;

/**
 * BarcodeDetector 対応判定。SSR 中は null (判定不能) を返し、
 * クライアントでは boolean を返す (hydration mismatch を避けるパターン)。
 */
function useBarcodeDetectorSupported(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    emptySubscribe,
    () =>
      typeof (window as WindowWithBarcodeDetector).BarcodeDetector ===
      "function",
    () => null,
  );
}

export function QrScanner({ eventId }: { eventId: string }) {
  /** null = SSR / マウント前 (判定不能) */
  const supported = useBarcodeDetectorSupported();
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** 同一 QR を映し続けたときの連続送信防止 */
  const lastScannedRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  // unmount 時にカメラを確実に解放する
  useEffect(() => stopCamera, [stopCamera]);

  const submitToken = useCallback(
    async (token: string): Promise<void> => {
      const trimmed = token.trim();
      if (!trimmed || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const result = await checkInByQrToken(eventId, trimmed);
        setFeedback(feedbackFor(result));
      } catch {
        setFeedback({ kind: "error", message: "通信エラーが発生しました。" });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [eventId],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setFeedback(null);
    lastScannedRef.current = null;

    const BarcodeDetector = (window as WindowWithBarcodeDetector)
      .BarcodeDetector;
    if (!BarcodeDetector) {
      // supported フックが false を返すため通常ここには来ない (防御的ガード)
      setCameraError(
        "このブラウザは QR 読み取りに対応していません。手動入力をご利用ください。",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "この環境ではカメラを利用できません。手動入力をご利用ください。",
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch {
      // NotAllowedError (権限拒否) / NotFoundError (カメラなし) 等。
      // alert は出さず inline メッセージで案内する。
      setCameraError(
        "カメラを起動できませんでした (権限が拒否されたか、カメラがありません)。手動入力をご利用ください。",
      );
      return;
    }

    streamRef.current = stream;
    setScanning(true);
    detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });

    // video 要素は scanning=true で描画されるので、次フレームで接続する
    requestAnimationFrame(() => {
      const video = videoRef.current;
      if (!video || !streamRef.current) return;
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    });

    timerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2 || busyRef.current) {
        return;
      }
      try {
        const codes = await detector.detect(video);
        const raw = codes[0]?.rawValue;
        if (!raw || raw === lastScannedRef.current) return;
        lastScannedRef.current = raw;
        await submitToken(raw);
      } catch {
        // 検出失敗フレームは無視して次のインターバルへ
      }
    }, 400);
  }, [submitToken]);

  return (
    <div className="mt-3 flex flex-col gap-3" data-testid="qr-scanner">
      {/* カメラスキャン (BarcodeDetector 対応ブラウザのみ) */}
      {supported === false ? (
        <p
          className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground"
          data-testid="qr-scanner-unsupported"
        >
          このブラウザは QR コードのカメラ読み取り (BarcodeDetector API)
          に対応していません。下の手動入力をご利用ください。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {!scanning ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={supported === null}
              className="inline-flex h-9 w-fit items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover disabled:opacity-50"
              data-testid="qr-camera-start"
            >
              カメラでスキャン
            </button>
          ) : (
            <>
              {/* カメラのライブプレビュー (音声なし・字幕不要) */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-video w-full max-w-md rounded-md border border-border bg-black object-cover"
                data-testid="qr-camera-preview"
              />
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex h-9 w-fit items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
                data-testid="qr-camera-stop"
              >
                スキャンを停止
              </button>
            </>
          )}
          {cameraError && (
            <p
              className="rounded-md border border-status-cancelled-bg bg-status-full-bg p-3 text-xs text-status-cancelled-bg"
              role="status"
              data-testid="qr-camera-error"
            >
              {cameraError}
            </p>
          )}
        </div>
      )}

      {/* 手動入力フォールバック (常時表示) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitToken(manualToken);
        }}
        className="flex flex-col gap-2"
        data-testid="qr-manual-form"
      >
        <label
          htmlFor="qr-manual-input"
          className="text-xs font-semibold text-foreground"
        >
          チケットコードを手動入力
        </label>
        <div className="flex gap-2">
          <input
            id="qr-manual-input"
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            autoComplete="off"
            placeholder="参加者のチケットコードを入力"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            data-testid="qr-manual-input"
          />
          <button
            type="submit"
            disabled={busy || manualToken.trim() === ""}
            className="inline-flex h-9 shrink-0 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft disabled:opacity-50"
            data-testid="qr-manual-submit"
          >
            チェックイン
          </button>
        </div>
      </form>

      {/* 結果表示 */}
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          data-testid="qr-scan-result"
          data-kind={feedback.kind}
          className={
            feedback.kind === "error"
              ? "rounded-md border border-status-cancelled-bg bg-status-full-bg p-3 text-sm text-status-cancelled-bg"
              : "rounded-md border border-status-open-fg bg-status-open-bg p-3 text-sm text-status-open-fg"
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

export default QrScanner;
