/**
 * タグフォロー / 解除ボタン (Server Component)。
 *
 * - 未ログイン時は `/login?next=/tag/{slug}` へのリンクとして描画。
 * - ログイン済みは `ActionForm` (client wrapper) + Server Action
 *   (`followTag` / `unfollowTag`) の form submit ボタン。
 * - E2E からは `data-testid` + `data-following` 属性で状態を判定する
 *   (bookmark-button と同じ規約)。
 *
 * `/tag/[slug]` / `/following/tags` / `/explore` (タグ絞り込み時) で共用。
 */
import Link from "next/link";

import ActionForm from "../../components/forms/ActionForm";
import { followTag, unfollowTag } from "@tech-event/web-feature-search";

export type TagFollowButtonProps = {
  /** 対象タグ id (BigInt を toString() したもの) */
  tagId: string;
  /** 対象タグ slug (未ログイン時の login リダイレクト先に使用) */
  slug: string;
  /** 現在フォロー中か */
  following: boolean;
  /** ログイン済みか (false ならログイン誘導リンクを表示) */
  loggedIn: boolean;
  /** ボタンサイズ (デフォルト md) */
  size?: "sm" | "md";
  /** E2E 用 testid (デフォルト "tag-follow-button") */
  testId?: string;
};

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
} as const;

export default function TagFollowButton({
  tagId,
  slug,
  following,
  loggedIn,
  size = "md",
  testId = "tag-follow-button",
}: TagFollowButtonProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/tag/${slug}`)}`}
        data-testid={`${testId}-login`}
        className={`inline-flex ${sizeClass} items-center justify-center gap-1.5 rounded-md border border-border bg-surface font-semibold text-foreground hover:bg-brand-orange-soft`}
      >
        <StarIcon filled={false} />
        フォローする
      </Link>
    );
  }

  if (following) {
    return (
      <ActionForm
        action={unfollowTag}
        toastMessage="ℹ︎ タグのフォローを解除しました"
        toastKind="info"
        data-testid={`${testId}-form-on`}
      >
        <input type="hidden" name="tagId" value={tagId} />
        <button
          type="submit"
          aria-pressed="true"
          data-testid={testId}
          data-following="true"
          className={`inline-flex ${sizeClass} items-center justify-center gap-1.5 rounded-md border border-brand-orange bg-brand-orange-soft font-semibold text-brand-orange hover:bg-brand-orange-soft`}
        >
          <StarIcon filled />
          フォロー中
        </button>
      </ActionForm>
    );
  }

  return (
    <ActionForm
      action={followTag}
      toastMessage="★ タグをフォローしました"
      toastKind="success"
      data-testid={`${testId}-form-off`}
    >
      <input type="hidden" name="tagId" value={tagId} />
      <button
        type="submit"
        aria-pressed="false"
        data-testid={testId}
        data-following="false"
        className={`inline-flex ${sizeClass} items-center justify-center gap-1.5 rounded-md border border-border bg-surface font-semibold text-foreground hover:bg-brand-orange-soft`}
      >
        <StarIcon filled={false} />
        フォローする
      </button>
    </ActionForm>
  );
}

/** 星アイコン (lucide Star 相当。stroke 1.5 / 14px、フォロー中は塗り) */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}
