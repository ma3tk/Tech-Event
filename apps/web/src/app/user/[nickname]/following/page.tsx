/**
 * フォロー中ユーザー一覧ページ
 *
 * URL: `/user/{nickname}/following`
 *
 * - `{nickname}` がフォローしているユーザー (active のみ) を新しい順に一覧表示。
 * - 対象ユーザーが存在しない / withdrawn の場合は `notFound()`。
 * - 公開情報 (プロフィールの公開フィールド) のみ表示する。
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ nickname: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { nickname } = await params;
  return { title: `${nickname} のフォロー中` };
}

export default async function UserFollowingPage({ params }: PageProps) {
  const { nickname } = await params;
  const user = await prisma.user.findUnique({
    where: { nickname },
    select: {
      id: true,
      nickname: true,
      displayName: true,
      status: true,
      followingCount: true,
    },
  });
  if (!user || user.status !== "active") {
    notFound();
  }

  const rows = await prisma.follow.findMany({
    where: { followerId: user.id, followee: { status: "active" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      followee: {
        select: {
          id: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          affiliation: true,
        },
      },
    },
  });
  const following = rows.map((r) => ({
    id: r.followee.id.toString(),
    nickname: r.followee.nickname,
    displayName: r.followee.displayName,
    avatarUrl: r.followee.avatarUrl,
    affiliation: r.followee.affiliation,
  }));

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm">
          <Link
            href={`/user/${user.nickname}`}
            className="text-link hover:text-link-hover"
          >
            ← {user.displayName} のプロフィールに戻る
          </Link>
        </p>
        <h1 className="mt-3 text-2xl font-bold">
          フォロー中{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({formatNumber(user.followingCount)} 人)
          </span>
        </h1>

        {following.length === 0 ? (
          <p
            className="mt-6 rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground"
            data-testid="following-empty"
          >
            フォロー中のユーザーはまだいません。
          </p>
        ) : (
          <ul className="mt-6 space-y-3" data-testid="following-list">
            {following.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/user/${u.nickname}`}
                  className="flex items-center gap-4 rounded-md border border-border bg-surface p-4 hover:border-brand-orange"
                >
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatarUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-lg font-bold text-white">
                      {u.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {u.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{u.nickname}
                      {u.affiliation ? ` ・ ${u.affiliation}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
