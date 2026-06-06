"use client";

/**
 * 汎用画像アップローダー (Client Component)。
 *
 * - `<input type="file" accept="image/*">` + プレビュー + 進捗ゲージ
 * - `POST /api/uploads/image` (multipart/form-data) を叩いて URL を取得し、
 *   `onUploaded(url)` で親に渡す。
 * - 親フォームには `<input type="hidden" name={name}>` を残しているので、URL を
 *   サーバアクションに従来通り送れる (既存 URL 入力との互換性を維持)。
 *
 * Props:
 *   - `name`             hidden input の name (例: "coverImageUrl")
 *   - `defaultValue`     既存 URL (編集時に復元)
 *   - `kind`             `event-cover` 等。サーバ側で resize ルール選択に使う
 *   - `label`            ボタン文言 (省略可)
 *   - `previewClassName` プレビュー領域の追加クラス
 *   - `onUploaded`       アップロード成功時のコールバック (任意)
 *
 * data-testid:
 *   - `image-uploader-{name}` ルート
 *   - `image-uploader-input-{name}` file input
 *   - `image-uploader-hidden-{name}` hidden URL input
 *   - `image-uploader-preview-{name}` プレビュー img
 *   - `image-uploader-status-{name}` 状態 (idle/uploading/success/error)
 */
import { useRef, useState } from "react";

import type { ImageKind } from "@/lib/storage";

export interface ImageUploaderProps {
  name: string;
  defaultValue?: string;
  kind?: ImageKind;
  label?: string;
  previewClassName?: string;
  /** アップロード成功時 */
  onUploaded?: (url: string) => void;
  /** プレビューサイズの aspect (CSS aspect-ratio 用) */
  aspectRatio?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function ImageUploader({
  name,
  defaultValue = "",
  kind = "raw",
  label = "画像を選択",
  previewClassName,
  onUploaded,
  aspectRatio,
}: ImageUploaderProps): React.ReactElement {
  const [url, setUrl] = useState<string>(defaultValue);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File): Promise<void> {
    setStatus("uploading");
    setProgress(0);
    setErrorMessage("");

    // XHR で progress を取りたいので fetch ではなく XMLHttpRequest を使う
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    try {
      const result = await uploadWithProgress(form, (p) => setProgress(p));
      if (result.status >= 200 && result.status < 300) {
        const json = JSON.parse(result.body) as { url?: string; error?: string };
        if (typeof json.url === "string") {
          setUrl(json.url);
          setStatus("success");
          setProgress(100);
          onUploaded?.(json.url);
        } else {
          setStatus("error");
          setErrorMessage(json.error ?? "unknown_error");
        }
      } else {
        let msg = `http_${result.status}`;
        try {
          const json = JSON.parse(result.body) as { error?: string };
          if (json.error) msg = json.error;
        } catch {
          // body が JSON でない場合は status コードのみを使う
        }
        setStatus("error");
        setErrorMessage(msg);
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const f = e.target.files?.[0];
    if (!f) return;
    void handleFile(f);
  }

  function clearImage(): void {
    setUrl("");
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
    onUploaded?.("");
  }

  return (
    <div className="space-y-2" data-testid={`image-uploader-${name}`}>
      {/* hidden: サーバアクションへ送る URL */}
      <input
        type="hidden"
        name={name}
        value={url}
        data-testid={`image-uploader-hidden-${name}`}
      />

      {/* プレビュー */}
      {url ? (
        <div
          className={["overflow-hidden rounded-md border border-border bg-white", previewClassName].filter(Boolean).join(" ")}
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="プレビュー"
            className="h-full w-full object-cover"
            data-testid={`image-uploader-preview-${name}`}
          />
        </div>
      ) : (
        <div
          className={["flex items-center justify-center rounded-md border border-dashed border-border bg-white text-xs text-muted-foreground", previewClassName].filter(Boolean).join(" ")}
          style={aspectRatio ? { aspectRatio } : { minHeight: "120px" }}
          data-testid={`image-uploader-empty-${name}`}
        >
          画像が選択されていません
        </div>
      )}

      {/* file input + URL 直接入力 */}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border bg-white px-3 text-sm font-medium hover:bg-brand-orange-soft"
        >
          {label}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onChange}
            data-testid={`image-uploader-input-${name}`}
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={clearImage}
            className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-xs text-muted-foreground hover:bg-brand-orange-soft"
            data-testid={`image-uploader-clear-${name}`}
          >
            削除
          </button>
        )}
        <span
          className="text-xs text-muted-foreground"
          data-testid={`image-uploader-status-${name}`}
        >
          {status === "uploading" && `アップロード中 ${progress}%`}
          {status === "success" && "アップロード完了"}
          {status === "error" && `エラー: ${errorMessage}`}
          {status === "idle" && (url ? "" : "5MB 以内 / PNG/JPG/WebP/GIF")}
        </span>
      </div>

      {/* URL 直接入力 (フォールバック / 既存 URL 指定キープ) */}
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://... (URL を直接指定することもできます)"
        maxLength={2000}
        className="block w-full rounded-md border border-border bg-white px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
        data-testid={`image-uploader-url-${name}`}
      />
    </div>
  );
}

/** XHR で進捗を取りつつ送信するヘルパー */
function uploadWithProgress(
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads/image");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      resolve({ status: xhr.status, body: xhr.responseText });
    };
    xhr.onerror = () => reject(new Error("network_error"));
    xhr.send(form);
  });
}
