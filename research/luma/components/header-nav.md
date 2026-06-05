# Luma Header / Global Navigation

## 役割

Luma の全ページ最上部に固定されるグローバルヘッダー。サイト全体の起点となり、ロゴ・主要ナビゲーション・認証導線を 1 行にミニマルに統合する。connpass のヘッダーが「情報量多め・複数階層」なのに対し、Luma は「リンク 1〜2 個 + Sign In のみ」というシリコンバレー流の極端な省略が特徴。

## 利用箇所

- ルート (luma.com /)
- Discover (luma.com/discover)
- イベント詳細 (luma.com/{slug})
- カレンダー詳細 (luma.com/{username})
- ユーザーホーム (ログイン後)
- 共有モーダル経由で開いた画面

## 構成要素

| 要素 | 内容 | 配置 |
| --- | --- | --- |
| Logo | Luma ワードマーク (太字サンセリフ、ホームへリンク) | 左端 |
| Primary nav | "Discover Events" のみ (1 リンク) | 左寄せ中央 |
| Spacer | flex-grow で空白 | 中央 |
| Auth CTA | ログイン中: ユーザーアバター + ドロップダウン<br>未ログイン: "Sign In" テキストリンク | 右端 |
| Create event button | ログイン中のみ "+ Create Event" (黒丸ボタン) | アバターの左 |

## Props 相当 (React 化する場合)

```ts
type HeaderNavProps = {
  user?: { name: string; avatarUrl: string } | null;
  activePath?: '/' | '/discover' | string;
  variant?: 'light' | 'dark' | 'transparent'; // イベントテーマに応じて
  showCreateButton?: boolean;
  onSignIn?: () => void;
  onCreate?: () => void;
};
```

## 状態バリエーション

1. **Anonymous (未ログイン)** — Logo / Discover Events / Sign In
2. **Authenticated** — Logo / Discover Events / + Create Event / Avatar (ドロップダウンで Settings, Calendars, Sign Out)
3. **Event page transparent mode** — イベント詳細ページではヘッダーがイベントテーマ色に透過合成 (背景が暗ければ白文字)
4. **Scroll state** — ページ上部では transparent、スクロール後は背景 (white / dark) で塗りつぶし backdrop-blur

## レスポンシブ

- **Desktop (≥ 1024px)**: 全要素を横並び。max-width 1200px センター揃え。
- **Tablet (640–1023px)**: Logo + ハンバーガー or 同じ構成 (要素が少ないので折りたたみ不要)。
- **Mobile (< 640px)**: Logo + Sign In のみ表示。"Discover" はボトムタブ or ハンバーガーへ。

## A11y

- `<header role="banner">` でランドマーク化
- Skip to main content リンクを SR 向けに先頭挿入
- Avatar ドロップダウンは `<button aria-haspopup="menu" aria-expanded>` + `role="menu"`
- フォーカスリングは Luma 標準のコバルトブルー (#5C66FF) のリング 2px

## React 実装案

```tsx
export function HeaderNav({ user, variant = 'light' }: HeaderNavProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full backdrop-blur',
        variant === 'dark' ? 'bg-black/70 text-white' : 'bg-white/80 text-neutral-900',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">Luma</Link>
        <nav className="flex-1">
          <Link href="/discover" className="text-sm font-medium hover:opacity-70">
            Discover Events
          </Link>
        </nav>
        {user ? (
          <>
            <Link href="/create" className="rounded-full bg-black px-3 py-1.5 text-sm text-white">
              + Create Event
            </Link>
            <UserMenu user={user} />
          </>
        ) : (
          <Link href="/signin" className="text-sm font-medium">Sign In</Link>
        )}
      </div>
    </header>
  );
}
```

## デザイントークン

- Height: 56px (h-14)
- Logo font: Inter / SF Pro 700, 20px
- Padding-x: 16px (mobile) / 32px (desktop)
- Border-bottom: なし (scrolled 時のみ 1px solid rgba(0,0,0,0.06))

## connpass との対比

connpass はヘッダーに「グループ・イベント検索・通知・ヘルプ・プロフィール」を横並びで詰め込む情報過多型。Luma は徹底的に削いで「Discover と Sign In だけ」とすることで「イベントが主役」というブランドメッセージを成立させている。
