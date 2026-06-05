# Luma Register Button (One-Tap RSVP)

## 役割

Luma の登録体験の核となる CTA ボタン。最大の特徴は「**One-Tap RSVP**」=「ログイン済みなら 1 クリックで登録完了 → 即チケット発行 → メール送信」というワークフロー。connpass の「フォーム入力 → 確認 → 完了」を 3 ステップから 1 ステップへ圧縮した。

## 利用箇所

- イベント詳細ページのヒーロー内
- スクロール後の sticky bottom bar
- カレンダー詳細のミニ Register
- 招待メール内のクリック先 (ワンタップ)
- 埋め込みウィジェット

## ボタン状態 (state machine)

```
未ログイン → "Register" → サインインモーダル → 完了
ログイン済 → "Register" → 1 クリック登録 → "You're in! 🎉"
承認制   → "Request to Join" → 質問入力 → "Pending Approval"
有料     → "Get Ticket - $25" → Stripe Checkout → 完了
満員     → "Join Waitlist"
登録済   → "You're in" + チケット詳細リンク
過去     → "Event Ended" disabled
```

## Props 相当

```ts
type RegisterButtonProps = {
  event: {
    status: 'open' | 'approval' | 'sold-out' | 'past' | 'cancelled';
    price?: { amount: number; currency: string };
    tintColor?: string;
  };
  userRegistration?:
    | { status: 'going' | 'pending' | 'waitlist' | 'invited' }
    | null;
  size?: 'md' | 'lg' | 'sticky';
  onClick: () => void;
};
```

## ラベル決定ロジック

```ts
function getLabel({ event, userRegistration }) {
  if (event.status === 'cancelled') return 'Cancelled';
  if (event.status === 'past') return 'Event Ended';
  if (userRegistration?.status === 'going') return "You're in! 🎉";
  if (userRegistration?.status === 'pending') return 'Pending Approval';
  if (userRegistration?.status === 'waitlist') return "You're on the Waitlist";
  if (event.status === 'sold-out') return 'Join Waitlist';
  if (event.status === 'approval') return 'Request to Join';
  if (event.price) return `Get Ticket · $${event.price.amount}`;
  return 'Register';
}
```

## A11y

- `<button>` で実装 (リンクではない、API 呼び出しを伴う)
- `aria-live="polite"` で登録完了を SR に通知
- disabled 時は `aria-disabled="true"` + `tabindex="-1"` を避け、フォーカス可能のままにしてツールチップで理由を出す
- 小さいスマホでも tap target 44×44 確保
- フォーカスリング: 2px outline + 2px offset、ボタンの tintColor を反映

## レスポンシブ

- Desktop: ヒーロー内に幅 100% の primary CTA
- Mobile: ヒーロー内 + スクロール後に sticky bottom (`fixed inset-x-0 bottom-0 z-50`)
- sticky 時はセーフエリア (env(safe-area-inset-bottom)) を考慮

## React 実装案

```tsx
export function RegisterButton({ event, userRegistration, size = 'lg', onClick }: RegisterButtonProps) {
  const label = getLabel({ event, userRegistration });
  const disabled = ['past', 'cancelled'].includes(event.status) || !!userRegistration?.status;
  const tint = event.tintColor ?? '#0a0a0a';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-live="polite"
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition',
        'shadow-lg active:scale-[0.98] disabled:opacity-60',
        size === 'lg' && 'h-12 w-full px-6 text-base',
        size === 'sticky' && 'h-14 w-full text-lg',
      )}
      style={{ backgroundColor: tint, color: getContrastColor(tint) }}
    >
      {label}
    </button>
  );
}
```

## One-Tap の裏側

1. クリック → Luma が Cookie で識別
2. 既存ユーザー: `POST /v1/event/add-guest` 相当 (approved) を内部 API で実行 → 即チケット生成
3. 新規ユーザー: 仮登録 → メールマジックリンクで認証 → 自動的に approved 化
4. 結果: ユーザー視点では「クリック → 数百ms → 登録完了 modal が出現」

## 真似すべきポイント

- **モーダル ≠ フォーム遷移**。クリック後は同じページにダイアログを出すだけにする
- ラベルが状況に応じて変わるので、ユーザーは常に「今この瞬間自分が何をすべきか」が分かる
- tintColor を使ってイベントごとに CTA 色が変わる演出は connpass にない強み

## デザイントークン

- Height: lg=48px, sticky=56px
- Border-radius: 12px
- Font: 16px / 600
- Active scale: 0.98
- Disabled opacity: 0.6

## connpass との比較

connpass の「参加申し込み」ボタンは固定青ベタ + 申し込みフォームページへ遷移。Luma は同一ページ内でモーダル → 完了まで一気通貫。離脱率の差はおそらく数倍。
