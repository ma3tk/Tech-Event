/**
 * `@tech-event/shared-util-action-error` — Server Action 共通エラー。
 *
 * - ActionError / isActionError / buildRedirectUrlWithFormError
 *
 * `useActionToast` は ui レイヤー (Sonner toast) に依存するため、
 * boundary `type:util → type:util only` の制約から本 lib には置けず、
 * `apps/web/src/hooks/useActionToast.ts` に維持する。
 */
export * from "./action-error";
