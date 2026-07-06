/**
 * フォロー中タグ一覧ページ (Server Component)
 *
 * URL: `/following/tags`
 *
 * - 認証必須。未ログインは `/login?next=/following/tags` にリダイレクト。
 * - `listFollowedTags(userId)` でフォロー中タグをフォロー日時の降順に一覧表示。
 *   各行: タグ名 (タグ詳細ページへのリンク) + イベント数 + フォロワー数 +
 *   解除ボタン (冪等な `unfollowTag`)。
 * - 0 件時は EmptyState でタグ探索 (/explore) へ誘導。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Breadcrumb from "@/components/Breadcrumb";
import TagPill from "@/components/TagPill";
import { EmptyState } from "@/components/ui/empty-state";
import { Tags } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { listFollowedTags } from "@tech-event/web-feature-search";

import TagFollowButton from "../../tag/TagFollowButton";

export const metadata: Metadata = {
  title: "フォロー中のタグ",
  description: "フォロー中のタグ一覧です。",
  robots: { index: false },
};

export default async function FollowingTagsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/following/tags")}`);
  }

  const followed = await listFollowedTags(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "フォロー中のタグ" },
        ]}
      />

      <header className="mt-4 mb-4 flex items-end justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          フォロー中のタグ
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {new Intl.NumberFormat("ja-JP").format(followed.length)}件
          </span>
        </h1>
        <Link
          href="/explore"
          className="text-xs text-link hover:underline"
        >
          イベントを探す →
        </Link>
      </header>

      {followed.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="フォロー中のタグはまだありません"
          description="タグ詳細ページからフォローすると、ここに一覧表示されます。"
          action={
            <Link
              href="/explore"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-background px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
            >
              イベントを探す
            </Link>
          }
        />
      ) : (
        <ul
          data-testid="followed-tag-list"
          className="divide-y divide-border rounded-md border border-border bg-surface"
        >
          {followed.map((t) => (
            <li
              key={t.slug}
              data-testid="followed-tag-item"
              data-tag-slug={t.slug}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <TagPill
                  label={t.name}
                  href={`/tag/${encodeURIComponent(t.slug)}`}
                  count={t.usageCount}
                  size="lg"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  フォロワー{" "}
                  {new Intl.NumberFormat("ja-JP").format(t.followerCount)}人 ・{" "}
                  {new Date(t.followedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                  からフォロー中
                </p>
              </div>
              <div className="shrink-0">
                <TagFollowButton
                  tagId={t.id.toString()}
                  slug={t.slug}
                  following
                  loggedIn
                  size="sm"
                  testId="followed-tag-unfollow"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
