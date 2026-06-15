/**
 * E2E 共通: Server Action フォーム submit の安定化ヘルパー。
 *
 * tech-event の bookmark / participate / approval 系ボタンは
 * `ActionForm` ("use client") でラップされた `<form action={serverAction}>`
 * の submit ボタンである。SSR 直後 (= hydration 前) はネイティブ form POST
 * として動き、hydration 後は React の `formAction` 経由でクライアント遷移する。
 *
 * Playwright が `domcontentloaded` 直後にボタンを click すると、ちょうど
 * hydration 途中で form 要素が React により差し替えられる瞬間に当たり、
 * click がネイティブにも React handler にも届かず「dead-click」になることがある
 * (= 期待する状態変化が起きず timeout → flake)。
 *
 * これを解消するため、本ヘルパーは「click → 期待する outcome を assert」を
 * `expect(...).toPass()` でラップし、outcome が出なければ click をリトライする。
 * これにより hydration timing race を locator-based 待機で吸収する
 * (CLAUDE.md §3.1 / §6.4: waitForTimeout 禁止)。
 */
import { expect, type Locator } from "@playwright/test";

export interface ClickUntilOptions {
  /** outcome 全体 (click + assert) のタイムアウト。デフォルト 20s */
  timeout?: number;
  /** 1 回の click→assert 試行で outcome を待つ間隔。デフォルト 4s */
  intervalAssertTimeout?: number;
}

/**
 * `trigger` を click し、`assertOutcome` が成立するまでリトライする。
 *
 * hydration race による dead-click を吸収するため、outcome が一定時間内に
 * 成立しなければ再度 `trigger` を click する。`trigger` 自身が outcome 成立後に
 * DOM から消える (detach) ケースでは、消える前に既に成立しているため安全。
 *
 * @param trigger click 対象 (form submit ボタン等)
 * @param assertOutcome 成立を待つ assertion (例: () => expect(loc).toBeVisible())
 */
export async function clickUntil(
  trigger: Locator,
  assertOutcome: () => Promise<void>,
  opts: ClickUntilOptions = {},
): Promise<void> {
  const timeout = opts.timeout ?? 20_000;
  const interval = opts.intervalAssertTimeout ?? 4_000;
  await expect(async () => {
    // trigger がまだ存在するなら click する (detach 後の outcome 再確認は click 不要)。
    if (await trigger.count()) {
      // enabled になってから click (disabled 中の click は no-op)。
      await trigger.first().click({ timeout: interval }).catch(() => undefined);
    }
    await assertOutcome();
  }).toPass({ timeout, intervals: [interval] });
}
