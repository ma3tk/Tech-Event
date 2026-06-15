/**
 * /admin/component-feedback の認可ヘルパ。
 *
 * このアプリには User へのグローバル role カラムが無い (admin は GroupAdmin で
 * グループスコープ管理) ため、内部 DS ツールである本画面は:
 *   - 本番: 環境変数 `COMPONENT_FEEDBACK_ADMINS` (カンマ区切りの nickname allowlist)
 *           に含まれるログインユーザーのみ許可。
 *   - dev:  `ENABLE_DEV_LOGIN=1` のときは任意のログインユーザーに許可 (動作確認用)。
 * のいずれかで認可する。未ログインは常に不許可。
 */
import type { User } from "@tech-event/shared-data-access-prisma";

export function isFeedbackAdmin(user: Pick<User, "nickname"> | null): boolean {
  if (!user) return false;
  const allow = (process.env.COMPONENT_FEEDBACK_ADMINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allow.includes(user.nickname)) return true;
  // dev 環境 (dev-login 有効) では内部ツールとして任意のログインユーザーに許可。
  if (process.env.ENABLE_DEV_LOGIN === "1") return true;
  return false;
}
