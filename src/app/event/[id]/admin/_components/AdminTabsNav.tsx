"use client";

/**
 * 主催者ダッシュボードのタブナビ (Client Component)
 *
 * - `usePathname()` でアクティブタブを判定する。
 * - 各タブは `/event/[id]/admin/{slug}` に相当し、Overview は slug 無しのルート。
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

type Tab = {
  key: string;
  label: string;
  href: (eventId: string) => string;
  match: (pathname: string, eventId: string) => boolean;
};

const TABS: Tab[] = [
  {
    key: "overview",
    label: "Overview",
    href: (id) => `/event/${id}/admin`,
    // 完全一致 (末尾スラッシュ許容)
    match: (p, id) =>
      p === `/event/${id}/admin` || p === `/event/${id}/admin/`,
  },
  {
    key: "guests",
    label: "Guests",
    href: (id) => `/event/${id}/admin/guests`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/guests`),
  },
  {
    key: "registration",
    label: "Registration",
    href: (id) => `/event/${id}/admin/registration`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/registration`),
  },
  {
    key: "blasts",
    label: "Blasts",
    href: (id) => `/event/${id}/admin/blasts`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/blasts`),
  },
  {
    key: "insights",
    label: "Insights",
    href: (id) => `/event/${id}/admin/insights`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/insights`),
  },
  {
    key: "survey",
    label: "Survey",
    href: (id) => `/event/${id}/admin/survey`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/survey`),
  },
  {
    key: "more",
    label: "More",
    href: (id) => `/event/${id}/admin/more`,
    match: (p, id) => p.startsWith(`/event/${id}/admin/more`),
  },
];

export default function AdminTabsNav({ eventId }: { eventId: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="主催者ダッシュボードタブ">
      {TABS.map((t) => {
        const active = t.match(pathname, eventId);
        return (
          <Link
            key={t.key}
            href={t.href(eventId)}
            data-testid={`admin-tab-${t.key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
