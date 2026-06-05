/**
 * Server Component ラッパー。
 *
 * - `getCurrentUser()` を呼び、結果を Client Component の Header に渡す。
 * - ログイン中であれば未読通知数も同時に取得し、ベルアイコンのバッジに反映する。
 * - i18n 辞書 (header section) を読み込み、ナビゲーション/メニューのラベルを翻訳済みで渡す。
 * - layout.tsx から呼ばれる。
 */
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadDict, t } from "@/lib/i18n";
import Header, { type HeaderUser, type HeaderLabels } from "./Header";

export default async function HeaderServer({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const user = await getCurrentUser();
  let unreadCount = 0;
  if (user) {
    unreadCount = await prisma.notification.count({
      where: { recipientUserId: user.id, readAt: null },
    });
  }
  const headerUser: HeaderUser | null = user
    ? {
        id: user.id.toString(),
        nickname: user.nickname,
        avatarUrl: user.avatarUrl ?? undefined,
        unreadNotificationCount: unreadCount,
      }
    : null;

  const { locale, dict } = await loadDict();
  const labels: HeaderLabels = {
    explore: t(dict, "header.explore"),
    discover: t(dict, "header.discover"),
    groups: t(dict, "header.groups"),
    calendars: t(dict, "header.calendars"),
    ranking: t(dict, "header.ranking"),
    pricing: t(dict, "header.pricing"),
    login: t(dict, "header.login"),
    signup: t(dict, "header.signup"),
    createEvent: t(dict, "header.createEvent"),
    notifications: t(dict, "header.notifications"),
    dashboard: t(dict, "header.dashboard"),
    profile: t(dict, "header.profile"),
    settings: t(dict, "header.settings"),
    logout: t(dict, "header.logout"),
  };

  return (
    <Header
      user={headerUser}
      searchQuery={searchQuery}
      labels={labels}
      locale={locale}
    />
  );
}
