/**
 * 通知設定ページ `/settings/notifications`
 *
 * - 認証必須。未ログインは /login にリダイレクト。
 * - 各 NotificationKind × チャネル (email/in_app/push) のオプトイン/オプトアウト
 *   を 1 枚の grid テーブルで管理する。
 * - 既存の `User.receiveNotificationEmail` / `receiveReminderEmail` /
 *   `receiveRecommendationEmail` も併設し、大カテゴリのメール ON/OFF として保持。
 * - 細粒度設定は `NotificationPreference` テーブル (kind, channel) ×
 *   `NOTIFICATION_KIND_KEYS` × `NOTIFICATION_CHANNEL_KEYS` で表現。レコード未登録の
 *   ペアは `enabled=true` として描画する。
 */
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  NOTIFICATION_KIND_KEYS,
  NOTIFICATION_KIND_LABELS,
  NOTIFICATION_CHANNEL_KEYS,
  NOTIFICATION_CHANNEL_LABELS,
} from "@/lib/notification";
import { bulkUpdateNotificationPreferences } from "@/app/actions/notification-preferences-actions";
import Breadcrumb from "@/components/Breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "通知設定",
  description:
    "tech-event の通知メール / サイト内 / プッシュ通知の受信設定をカスタマイズします。",
};

type SearchParams = Promise<{ saved?: string }>;

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/settings/notifications");
  }

  const sp = await searchParams;
  const saved = sp.saved === "1";

  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });
  // Map: `${kind}__${channel}` -> enabled (default true)
  const enabledMap = new Map<string, boolean>();
  for (const p of prefs) {
    enabledMap.set(`${p.kind}__${p.channel}`, p.enabled);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "設定", href: "/settings/notifications" },
          { label: "通知設定" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">通知設定</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        受信する通知の種類とチャネルを切り替えられます。
      </p>

      {saved && (
        <p
          role="status"
          data-testid="notification-settings-saved"
          className="mt-4 rounded-md border border-brand-orange bg-brand-orange-soft px-3 py-2 text-sm text-brand-orange"
        >
          設定を保存しました。
        </p>
      )}

      <form
        action={bulkUpdateNotificationPreferences}
        method="post"
        className="mt-6 space-y-4"
        data-testid="notification-preferences-form"
      >
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">通知の種類</th>
                {NOTIFICATION_CHANNEL_KEYS.map((c) => (
                  <th key={c} className="px-3 py-2 text-center">
                    {NOTIFICATION_CHANNEL_LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_KIND_KEYS.map((kind) => (
                <tr
                  key={kind}
                  className="border-b border-border last:border-0"
                  data-testid={`notification-pref-row-${kind}`}
                >
                  <td className="px-3 py-3 text-foreground">
                    <p className="font-medium">
                      {NOTIFICATION_KIND_LABELS[kind]}
                    </p>
                    <p className="text-xs text-muted-foreground">{kind}</p>
                  </td>
                  {NOTIFICATION_CHANNEL_KEYS.map((channel) => {
                    const key = `${kind}__${channel}`;
                    // レコード無し → 既定 ON
                    const checked = enabledMap.has(key)
                      ? !!enabledMap.get(key)
                      : true;
                    const name = `pref[${kind}][${channel}]`;
                    return (
                      <td key={channel} className="px-3 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            name={name}
                            value="1"
                            defaultChecked={checked}
                            data-testid={`notification-pref-switch-${kind}-${channel}`}
                            className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-border-strong transition-colors checked:bg-brand-orange relative before:content-[''] before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
                            aria-label={`${NOTIFICATION_KIND_LABELS[kind]} を ${NOTIFICATION_CHANNEL_LABELS[channel]} で受け取る`}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            data-testid="notification-preferences-save"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            設定を保存
          </button>
        </div>
      </form>

      <section
        aria-labelledby="legacy-email-flags"
        className="mt-10 space-y-2 rounded-md border border-border bg-surface p-4"
      >
        <h2 id="legacy-email-flags" className="text-sm font-bold">
          メール全般の受信
        </h2>
        <p className="text-xs text-muted-foreground">
          以下は大カテゴリのメール ON/OFF
          (既存のユーザー設定と互換)。細粒度の調整は上の表を利用してください。
        </p>
        <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <li>
            通知メール:{" "}
            <strong>
              {user.receiveNotificationEmail ? "受信する" : "受信しない"}
            </strong>
          </li>
          <li>
            リマインドメール:{" "}
            <strong>
              {user.receiveReminderEmail ? "受信する" : "受信しない"}
            </strong>
          </li>
          <li>
            おすすめメール:{" "}
            <strong>
              {user.receiveRecommendationEmail ? "受信する" : "受信しない"}
            </strong>
          </li>
        </ul>
      </section>
    </div>
  );
}
