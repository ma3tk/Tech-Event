/**
 * イベント編集ページ (owner / group admin 限定)
 *
 * - 既存値をフォームに復元
 * - 参加枠の追加 / 削除はここでは行わず、基本情報のみ更新可
 * - 公開 / 中止ボタンも併設
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  updateEvent,
  publishEvent,
  cancelEvent,
} from "@/app/actions/event-admin-actions";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/app/actions/survey-actions";
import {
  addPresentation,
  removePresentation,
} from "@/app/actions/presentation-actions";
import MarkdownEditor from "@/components/MarkdownEditorDynamic";
import ImageUploader from "@/components/ImageUploader";
import { isStripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Date を datetime-local 用の `YYYY-MM-DDTHH:mm` 文字列に変換 */
function toDatetimeLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EventEditPage({ params }: PageProps) {
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const eventId = BigInt(raw);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/event/${raw}/edit`)}`);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: true,
      roles: { orderBy: { displayOrder: "asc" } },
      surveys: {
        where: { trigger: "on_apply" },
        include: { questions: { orderBy: { displayOrder: "asc" } } },
      },
      presentations: { orderBy: { displayOrder: "asc" } },
    },
  });
  if (!event) notFound();
  const survey = event.surveys[0] ?? null;
  const presentations = event.presentations;

  // 権限チェック
  const isOwner = event.ownerId === user.id;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
  });
  const isAdmin =
    !!admin && (admin.role === "owner" || admin.role === "admin");
  if (!isOwner && !isAdmin) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href={`/event/${event.id}`} className="hover:underline">
          ← イベントに戻る
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">イベントを編集する</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        状態: <strong>{event.status}</strong> / グループ: {event.group.name}
      </p>

      <form
        action={updateEvent}
        method="post"
        className="mt-6 space-y-8"
        data-testid="event-edit-form"
      >
        <input type="hidden" name="eventId" value={event.id.toString()} />

        <Section title="基本情報">
          <Field label="タイトル" htmlFor="title" required>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={event.title}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="キャッチコピー" htmlFor="catchPhrase">
            <input
              id="catchPhrase"
              name="catchPhrase"
              type="text"
              maxLength={300}
              defaultValue={event.catchPhrase ?? ""}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="説明 (Markdown)" htmlFor="description">
            <MarkdownEditor
              id="description"
              name="description"
              rows={10}
              maxLength={50_000}
              defaultValue={event.description ?? ""}
              placeholder="## 概要&#10;このイベントは..."
              testIdPrefix="event-description-editor"
            />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="カバー画像" htmlFor="coverImageUrl">
              <ImageUploader
                name="coverImageUrl"
                defaultValue={event.coverImageUrl ?? ""}
                kind="event-cover"
                aspectRatio="660 / 370"
                label="カバー画像を選択"
              />
            </Field>
            <Field label="ハッシュタグ" htmlFor="hashTag">
              <input
                id="hashTag"
                name="hashTag"
                type="text"
                maxLength={120}
                defaultValue={event.hashTag ?? ""}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
          </div>
        </Section>

        <Section title="開催形式・会場">
          <Field label="開催形式" htmlFor="eventFormat" required>
            <select
              id="eventFormat"
              name="eventFormat"
              defaultValue={event.eventFormat}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            >
              <option value="offline">オフライン (会場)</option>
              <option value="online">オンライン</option>
              <option value="hybrid">ハイブリッド</option>
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="会場名" htmlFor="place">
              <input
                id="place"
                name="place"
                type="text"
                maxLength={200}
                defaultValue={event.place ?? ""}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="住所" htmlFor="address">
              <input
                id="address"
                name="address"
                type="text"
                maxLength={300}
                defaultValue={event.address ?? ""}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
          </div>
          <Field label="オンライン URL" htmlFor="onlineUrl">
            <input
              id="onlineUrl"
              name="onlineUrl"
              type="url"
              maxLength={2000}
              defaultValue={event.onlineUrl ?? ""}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </Section>

        <Section title="日時・募集期間">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="開始日時" htmlFor="startedAt" required>
              <input
                id="startedAt"
                name="startedAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(event.startedAt)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="終了日時" htmlFor="endedAt" required>
              <input
                id="endedAt"
                name="endedAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(event.endedAt)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="募集開始日時" htmlFor="acceptsFrom">
              <input
                id="acceptsFrom"
                name="acceptsFrom"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event.acceptsFrom)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="募集締切日時" htmlFor="acceptsUntil">
              <input
                id="acceptsUntil"
                name="acceptsUntil"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event.acceptsUntil)}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
          </div>
        </Section>

        <Section title="募集設定">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="全体定員 (任意)" htmlFor="capacity">
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={0}
                defaultValue={event.capacity ?? ""}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="受付方式" htmlFor="recruitmentMethod">
              <select
                id="recruitmentMethod"
                name="recruitmentMethod"
                defaultValue={event.recruitmentMethod}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                <option value="fcfs">先着順</option>
                <option value="lottery">抽選</option>
              </select>
            </Field>
          </div>
          <Field label="抽選発表日時" htmlFor="lotteryAnnounceAt">
            <input
              id="lotteryAnnounceAt"
              name="lotteryAnnounceAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(event.lotteryAnnounceAt)}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          {/* Approval Required (Luma 風) トグル */}
          <label
            className="flex items-start gap-2 text-sm text-foreground"
            data-testid="event-approval-required-label"
          >
            <input
              type="checkbox"
              name="approvalRequired"
              value="1"
              defaultChecked={event.approvalRequired}
              data-testid="event-approval-required"
              className="mt-0.5 h-4 w-4 rounded border-border accent-brand-orange"
            />
            <span>
              承認制にする
              <span className="ml-1 text-xs text-muted-foreground">
                (申請後、主催者が個別に承認した参加者のみ確定します)
              </span>
            </span>
          </label>
        </Section>

        {/* ============ テーマカスタマイズ (Luma 参考) ============ */}
        <Section title="テーマカスタマイズ">
          <p className="text-xs text-muted-foreground">
            色やフォントを変更してイベントページに個性を出せます。未設定なら従来のデフォルトテーマを維持します。
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Field label="アクセントカラー" htmlFor="themeTintColor">
              <input
                id="themeTintColor"
                name="themeTintColor"
                type="color"
                defaultValue={event.themeTintColor ?? "#ea5404"}
                data-testid="theme-tint-color"
                className="block h-10 w-full rounded-md border border-border bg-white px-1 py-1 focus:border-brand-orange focus:outline-none"
              />
            </Field>
            <Field label="背景スタイル" htmlFor="themeBackgroundStyle">
              <select
                id="themeBackgroundStyle"
                name="themeBackgroundStyle"
                defaultValue={event.themeBackgroundStyle ?? "solid"}
                data-testid="theme-background-style"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                <option value="solid">単色</option>
                <option value="gradient">グラデーション</option>
                <option value="image">画像 (カバー画像を使用)</option>
              </select>
            </Field>
            <Field label="フォント" htmlFor="themeFontStyle">
              <select
                id="themeFontStyle"
                name="themeFontStyle"
                defaultValue={event.themeFontStyle ?? "default"}
                data-testid="theme-font-style"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                <option value="default">デフォルト (Noto Sans JP)</option>
                <option value="serif">明朝 (Serif)</option>
                <option value="mono">等幅 (Mono)</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="themeReset"
              value="1"
              data-testid="theme-reset"
              className="rounded border-border"
            />
            テーマ設定をリセットしてデフォルトに戻す
          </label>
        </Section>

        {/* ============ Stripe 決済 ============ */}
        <Section title="Stripe 決済">
          <p className="text-xs text-muted-foreground">
            Stripe Checkout を使った事前決済を有効化できます。Stripe 機能を有効にしたうえで、
            参加枠の料金タイプを「前払い」に設定すると、参加申込時に Stripe Checkout 画面に遷移します。
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="stripeEnabled"
              value="1"
              data-testid="stripe-enabled-toggle"
              defaultChecked={isStripeEnabled()}
              disabled={!isStripeEnabled()}
              className="rounded border-border"
            />
            Stripe 決済を有効化
            {!isStripeEnabled() && (
              <span className="text-xs text-muted-foreground">
                (環境変数 STRIPE_SECRET_KEY 未設定のため、現在は利用できません)
              </span>
            )}
          </label>
          <Field
            label="接続済み Stripe Account ID (任意)"
            htmlFor="stripeAccountId"
            help="単一テナントモードでは STRIPE_SECRET_KEY を使用するため、ここは情報表示用です。"
          >
            <input
              id="stripeAccountId"
              name="stripeAccountId"
              type="text"
              placeholder="acct_..."
              data-testid="stripe-account-id"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
          <Link
            href={`/event/${event.id}`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="event-edit-save"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            変更を保存
          </button>
        </div>
      </form>

      {/* ============ 申込時の質問 (Survey) ============ */}
      <SurveySection eventId={event.id.toString()} survey={survey} />

      {/* ============ 発表資料 (PresentationMaterial) ============ */}
      <PresentationSection
        eventId={event.id.toString()}
        presentations={presentations.map((p) => ({
          id: p.id.toString(),
          title: p.title,
          url: p.url,
          presenterDisplayName: p.presenterDisplayName,
          thumbnailUrl: p.thumbnailUrl,
        }))}
      />

      {/* ============ 状態変更フォーム ============ */}
      <div className="mt-10 space-y-4">
        <h2 className="text-lg font-bold">公開状態</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4">
          {event.status !== "published" && (
            <form action={publishEvent}>
              <input type="hidden" name="eventId" value={event.id.toString()} />
              <button
                type="submit"
                data-testid="event-publish"
                className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
              >
                公開する
              </button>
            </form>
          )}
          {event.status !== "cancelled" && (
            <form action={cancelEvent}>
              <input type="hidden" name="eventId" value={event.id.toString()} />
              <button
                type="submit"
                data-testid="event-cancel"
                className="inline-flex h-10 items-center rounded-md border border-status-cancelled-bg bg-surface px-5 text-sm font-semibold text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
              >
                イベントを中止
              </button>
            </form>
          )}
          <Link
            href={`/event/${event.id}/admin`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-5 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            主催者ダッシュボード
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          現在の参加枠 ({event.roles.length} 件):{" "}
          {event.roles.map((r) => r.name).join(" / ")}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  help,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-status-cancelled-fg">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/* ============================================================
 * 申込時の質問 (Survey) セクション
 * ============================================================ */

type SurveyQuestionLite = {
  id: bigint;
  displayOrder: number;
  body: string;
  inputType: string;
  options: string | null;
  required: boolean;
};

type SurveyLite = {
  id: bigint;
  title: string;
  questions: SurveyQuestionLite[];
} | null;

function SurveySection({
  eventId,
  survey,
}: {
  eventId: string;
  survey: SurveyLite;
}) {
  const questions = survey?.questions ?? [];
  return (
    <section
      className="mt-10 space-y-4 rounded-lg border border-border bg-surface p-6"
      data-testid="survey-section"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">申込時の質問</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            設定すると、参加申込時に専用フォーム (
            <code>/event/{eventId}/apply</code>) が開きます。
          </p>
        </div>
        {questions.length > 0 && (
          <Link
            href={`/event/${eventId}/admin/survey`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-white px-4 text-sm font-medium hover:bg-brand-orange-soft"
            data-testid="survey-admin-link"
          >
            回答を見る
          </Link>
        )}
      </header>

      {/* 質問一覧 */}
      {questions.length === 0 ? (
        <p
          className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground"
          data-testid="survey-empty"
        >
          まだ質問は登録されていません。
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="survey-question-list">
          {questions.map((q) => (
            <li
              key={q.id.toString()}
              className="rounded-md border border-border bg-white p-4"
              data-testid={`survey-question-row-${q.id.toString()}`}
            >
              <form action={updateQuestion} className="flex flex-col gap-3">
                <input type="hidden" name="eventId" value={eventId} />
                <input
                  type="hidden"
                  name="questionId"
                  value={q.id.toString()}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_120px_80px]">
                  <input
                    type="text"
                    name="body"
                    defaultValue={q.body}
                    required
                    maxLength={500}
                    className="rounded-md border border-border bg-white px-3 py-2 text-sm"
                  />
                  <select
                    name="inputType"
                    defaultValue={q.inputType}
                    className="rounded-md border border-border bg-white px-3 py-2 text-sm"
                  >
                    <option value="text">テキスト (1行)</option>
                    <option value="textarea">テキスト (複数行)</option>
                    <option value="single">単一選択</option>
                    <option value="multi">複数選択</option>
                    <option value="scale">段階評価</option>
                  </select>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={q.displayOrder}
                    min={1}
                    max={999}
                    className="rounded-md border border-border bg-white px-3 py-2 text-sm"
                    aria-label="表示順"
                  />
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      name="required"
                      value="1"
                      defaultChecked={q.required}
                    />
                    必須
                  </label>
                </div>
                <input
                  type="text"
                  name="options"
                  defaultValue={q.options ?? ""}
                  placeholder='選択肢を ["A","B"] 形式 / カンマ区切り / scale は "1,5"'
                  className="rounded-md border border-border bg-white px-3 py-2 font-mono text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-md border border-brand-orange bg-white px-3 text-xs font-semibold text-brand-orange hover:bg-brand-orange-soft"
                    data-testid={`survey-update-${q.id.toString()}`}
                  >
                    更新
                  </button>
                </div>
              </form>
              <form
                action={deleteQuestion}
                className="mt-2 inline-block"
              >
                <input type="hidden" name="eventId" value={eventId} />
                <input
                  type="hidden"
                  name="questionId"
                  value={q.id.toString()}
                />
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-md border border-status-cancelled-bg bg-white px-3 text-xs font-medium text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
                  data-testid={`survey-delete-${q.id.toString()}`}
                >
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* 追加フォーム */}
      <form
        action={createQuestion}
        className="mt-2 flex flex-col gap-3 rounded-md border border-dashed border-border bg-white p-4"
        data-testid="survey-add-form"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <p className="text-xs font-semibold text-foreground">質問を追加</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_80px]">
          <input
            type="text"
            name="body"
            required
            maxLength={500}
            placeholder="例: ご職業を教えてください"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm"
            data-testid="survey-add-body"
          />
          <select
            name="inputType"
            defaultValue="text"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm"
            data-testid="survey-add-input-type"
          >
            <option value="text">テキスト (1行)</option>
            <option value="textarea">テキスト (複数行)</option>
            <option value="single">単一選択</option>
            <option value="multi">複数選択</option>
            <option value="scale">段階評価</option>
          </select>
          <label className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              name="required"
              value="1"
              data-testid="survey-add-required"
            />
            必須
          </label>
        </div>
        <input
          type="text"
          name="options"
          placeholder='選択肢: ["A","B"] 形式 / カンマ区切り / scale は "1,5"'
          className="rounded-md border border-border bg-white px-3 py-2 font-mono text-xs"
          data-testid="survey-add-options"
        />
        <button
          type="submit"
          className="inline-flex h-9 w-fit items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          data-testid="survey-add-submit"
        >
          質問を追加
        </button>
      </form>
    </section>
  );
}

/* ============================================================
 * 発表資料 (PresentationMaterial) セクション
 *
 * data-model review Critical #3: `Group.presentationCount` がアプリから
 * 一切更新されなかったため、簡易 UI で資料の追加/削除を行えるようにする。
 * ============================================================ */

type PresentationLite = {
  id: string;
  title: string;
  url: string;
  presenterDisplayName: string | null;
  thumbnailUrl: string | null;
};

function PresentationSection({
  eventId,
  presentations,
}: {
  eventId: string;
  presentations: PresentationLite[];
}) {
  return (
    <section
      id="presentations"
      className="mt-10 space-y-4 rounded-lg border border-border bg-surface p-6"
      data-testid="presentations-section"
    >
      <header>
        <h2 className="text-lg font-bold">発表資料</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          スライド / 資料の URL を登録すると、イベントページの「発表資料」セクションに表示されます。
        </p>
      </header>

      {presentations.length === 0 ? (
        <p
          className="rounded-md border border-dashed border-border bg-white p-4 text-sm text-muted-foreground"
          data-testid="presentations-empty"
        >
          まだ発表資料は登録されていません。
        </p>
      ) : (
        <ul
          className="flex flex-col gap-3"
          data-testid="presentations-list"
        >
          {presentations.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-white p-4"
              data-testid={`presentation-row-${p.id}`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.presenterDisplayName ?? "登壇者未指定"} ・{" "}
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {p.url}
                  </a>
                </div>
              </div>
              <form action={removePresentation}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="presentationId" value={p.id} />
                <button
                  type="submit"
                  data-testid={`presentation-remove-${p.id}`}
                  className="inline-flex h-9 items-center rounded-md border border-status-cancelled-bg bg-surface px-3 text-xs font-medium text-status-cancelled-fg hover:bg-status-cancelled-bg/20"
                >
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={addPresentation}
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_140px_auto]"
        data-testid="presentation-add-form"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <input
          type="text"
          name="title"
          placeholder="タイトル"
          required
          maxLength={200}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          data-testid="presentation-add-title"
        />
        <input
          type="url"
          name="url"
          placeholder="https://speakerdeck.com/..."
          required
          maxLength={2000}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          data-testid="presentation-add-url"
        />
        <input
          type="text"
          name="presenterDisplayName"
          placeholder="登壇者名 (任意)"
          maxLength={200}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          data-testid="presentation-add-presenter"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          data-testid="presentation-add-submit"
        >
          追加
        </button>
      </form>
    </section>
  );
}
