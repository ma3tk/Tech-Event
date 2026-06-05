# header-nav — グローバルヘッダー・ナビゲーション

## 役割と利用箇所

connpass の全ページ最上部に固定/配置されるグローバルヘッダー。サイト全体のブランディング、検索導線、認証状態の表示、主要ナビゲーション(新着イベント、イベント作成、ログイン/ユーザーメニュー)を担う。すべてのページ(トップ、イベント一覧、イベント詳細、グループページ、カレンダー、ランキング、検索、ログイン、ダッシュボード)で共通して表示される。

具体的な利用箇所:
- `/` (トップページ)
- `/explore/`, `/event/`, `/series/`, `/calendar/`, `/ranking/`, `/search/`
- `/event/{id}/` (イベント詳細、サブドメインの個別グループサイトを含む)
- `/login/`, `/dashboard/`

未ログイン時とログイン時で表示要素が大きく異なるため、状態管理が必要なコンポーネント。

## 視覚的構造

### デスクトップ (未ログイン)

```
+--------------------------------------------------------------------------+
| [connpass logo]   [search-icon] [新着イベント] [イベント作成]  [ログイン] |
+--------------------------------------------------------------------------+
```

### デスクトップ (ログイン後)

```
+--------------------------------------------------------------------------+
| [logo]  [search-icon] [新着イベント] [イベント作成]  [Bell] [Avatar▾]    |
+--------------------------------------------------------------------------+
                                                          |
                                                          v (ドロップダウン)
                                                +-----------------------+
                                                | [Avatar] username    |
                                                +-----------------------+
                                                | 参加予定イベント       |
                                                | 管理イベント          |
                                                | プロフィール編集       |
                                                | 設定                 |
                                                | ログアウト            |
                                                +-----------------------+
```

### モバイル

```
+----------------------------------+
| ☰  [connpass logo]   🔍  [Avatar]|
+----------------------------------+
   |
   v (ハンバーガー展開)
+----------------------------------+
| 新着イベント                      |
| イベントを探す                    |
| カレンダー                        |
| ランキング                        |
| グループを探す                    |
| ─────────────────                |
| イベントを作成する                 |
| ログイン・新規登録                 |
+----------------------------------+
```

## Props 相当の入力データ

```ts
type HeaderNavProps = {
  user?: {
    id: string;
    nickname: string;
    avatarUrl: string;
    unreadNotificationCount?: number;
  } | null;             // null = 未ログイン
  searchQuery?: string; // 検索ボックスの初期値
  currentPath?: string; // アクティブ状態のハイライト用
  variant?: 'default' | 'transparent'; // トップページのヒーロー上では透過
  onSearchSubmit?: (q: string) => void;
  onLogout?: () => void;
};
```

参考要素 (connpass 実例より):
- ロゴ: 「connpass - エンジニアをつなぐIT勉強会支援プラットフォーム」のテキスト + 画像ロゴ
- ナビ項目: 「新着イベント」「イベントを作成する」「ログイン・新規登録」
- 検索: 虫眼鏡アイコンクリックで検索ボックス展開、または常時表示

## 状態バリエーション

| 状態 | 表示の差分 |
|---|---|
| default (未ログイン) | 「ログイン・新規登録」ボタンを右端に表示 |
| default (ログイン後) | アバター + ベルアイコン (未読数バッジ) |
| hover (ナビ項目) | テキスト色変化 (アクセントカラー or アンダーライン) |
| active (現在ページ) | リンクに下線または背景色で明示 |
| search-focus | 検索入力欄が拡張され、サジェスト候補がドロップダウン |
| dropdown-open | アバターをクリック時、ユーザーメニュー展開 (focus trap) |
| loading | アバター読み込み中はスケルトン円 |
| error (通知取得失敗) | ベルアイコンの未読数は非表示 (silent fail) |
| sticky | スクロール時に上部固定、box-shadow を追加 |

## レスポンシブでの変化

- **>= 1024px (desktop)**: 全ナビ項目を横並びで表示。検索ボックスはアイコンから展開、または最初から横長表示。
- **768px–1023px (tablet)**: 「イベントを作成する」など一部 CTA を省略しアイコン化。
- **< 768px (mobile)**: ハンバーガーメニュー (☰) に集約。検索アイコンとアバターのみ残す。アバタータップでフルスクリーンメニュー表示。

ブレークポイントの目安:
- xs (~480px): ロゴをアイコンのみに縮小
- sm (~768px): ハンバーガー切替
- md (~1024px): 検索ボックスを常時表示
- lg (>=1280px): すべてのナビ項目フル表示

## アクセシビリティ要件

- ルート要素: `<header role="banner">`
- ナビ: `<nav aria-label="グローバルナビゲーション">`
- 検索フォーム: `<form role="search">`、入力に `aria-label="イベントを検索"`、`<button type="submit">` には `aria-label="検索"` を付与
- ハンバーガーボタン: `aria-expanded`, `aria-controls="mobile-menu"`, `aria-label="メニューを開く/閉じる"`
- ユーザードロップダウン: トリガーに `aria-haspopup="menu"`, `aria-expanded`、`<ul role="menu">`、各項目 `role="menuitem"`
- ベルアイコン: `aria-label="通知 (3件)"`(未読数を読み上げ)
- キーボード:
  - Tab で順次フォーカス
  - Esc でドロップダウン閉じる
  - ドロップダウン内は ↑↓ で移動 (要 roving tabindex)
- フォーカスリング: 既定の `:focus-visible` を必ず可視化

## 推測される HTML 構造と CSS 設計の方針

```html
<header class="c-header" role="banner">
  <div class="c-header__inner">
    <a href="/" class="c-header__logo" aria-label="connpass トップへ">
      <img src="/logo.svg" alt="" />
      <span class="c-header__logo-text">connpass</span>
    </a>
    <form class="c-header__search" role="search" action="/search/" method="get">
      <label class="u-visually-hidden" for="q">イベントを検索</label>
      <input id="q" name="keyword" type="search" placeholder="キーワードで検索" />
      <button type="submit" aria-label="検索">🔍</button>
    </form>
    <nav class="c-header__nav" aria-label="グローバルナビゲーション">
      <ul>
        <li><a href="/explore/">新着イベント</a></li>
        <li><a href="/event/new/">イベントを作成する</a></li>
      </ul>
    </nav>
    <div class="c-header__account">
      <!-- 未ログイン: ボタン / ログイン後: avatar + dropdown -->
    </div>
  </div>
</header>
```

CSS 方針:
- BEM (`c-header__*`) または CSS Modules
- レイアウトは flex (justify-content: space-between, gap)
- 高さは 56–64px 固定。`position: sticky; top: 0; z-index: 1000`
- 検索ボックスは grow: 1 で可変、最大幅 480px
- カラートークン: `--color-bg-header`, `--color-accent`
- モバイル時はメディアクエリでナビを `display: none`、ハンバーガーを表示

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// HeaderNav.tsx
type Props = {
  user: User | null;
  onLogout?: () => void;
};

export function HeaderNav({ user, onLogout }: Props) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  return (
    <header className={styles.root} role="banner">
      <div className={styles.inner}>
        <Logo />
        <SearchBox />
        <DesktopNav />
        <AccountArea
          user={user}
          isOpen={isUserMenuOpen}
          onToggle={setUserMenuOpen}
          onLogout={onLogout}
        />
        <HamburgerButton
          expanded={isMobileOpen}
          onClick={() => setMobileOpen(v => !v)}
        />
      </div>
      <MobileMenu open={isMobileOpen} user={user} />
    </header>
  );
}
```

設計のポイント:
- 子コンポーネント `Logo` / `SearchBox` / `DesktopNav` / `AccountArea` / `MobileMenu` / `HamburgerButton` に分割
- `user` の取得は `useCurrentUser()` フック (SWR/React Query) を別途用意し、`HeaderNav` 自身は受け取るだけにする (テストしやすい)
- `useDropdown(ref)` カスタムフックでクリックアウト + Esc 閉じを実装
- 通知未読数は `<NotificationBell count={user.unreadNotificationCount} />` に分離
- SSR 対応のため、初期状態はサーバーから受け取る (`user` を props に)
- a11y: `@reach/menu-button` や Radix UI `DropdownMenu` を採用すると堅牢
- スタイル: Tailwind か CSS Modules。Sticky 化と `backdrop-filter: blur` でモダンな見た目に
- テスト: RTL でログイン状態の出し分け、Esc/Tab キー、検索送信を確認
