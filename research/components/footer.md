# footer — グローバルフッター

## 役割と利用箇所

サイト全体の最下部に表示される共通フッター。ヘルプ・FAQ・問い合わせ等のサポート導線、利用規約・プライバシーポリシー等の法務情報、関連サービス (PyQ, TRACERY) や運営会社 (株式会社ビープラウド) の表示、SNS リンクなどを集約。

全ページ共通で表示:
- `/`、`/about/`、`/explore/`、`/event/{id}/`、`/series/`、`/calendar/`、`/ranking/`、`/login/`、`/search/`

connpass の実フッターでは概ね以下のグループ構成:
1. ヘルプ・問い合わせ (ご利用ガイド / よくある質問 / お問い合わせ)
2. ビジネス情報 (広告掲載 / 利用規約 / 運営会社 / API)
3. 法務・プライバシー (特定商取引法表示 / プライバシーポリシー)
4. 関連サービス (PyQ / TRACERY)
5. SNS (Twitter / Facebook)
6. コピーライト (株式会社ビープラウドが開発・運営)

## 視覚的構造

### デスクトップ

```
+--------------------------------------------------------------------------+
| ヘルプ              ビジネス        法務           関連サービス  SNS      |
| ・ご利用ガイド       ・広告掲載      ・特商法表示    ・PyQ          [X]   |
| ・よくある質問       ・利用規約      ・プライバシー  ・TRACERY      [Fb]  |
| ・お問い合わせ       ・運営会社                                          |
|                    ・API                                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  [connpass logo]   © 2026 BeProud Inc. All Rights Reserved.              |
|                                                                          |
+--------------------------------------------------------------------------+
```

### モバイル (アコーディオン化)

```
+------------------------+
| ヘルプ              ▼  |
+------------------------+
| ビジネス情報         ▼  |
+------------------------+
| 法務・プライバシー    ▼  |
+------------------------+
| 関連サービス         ▼  |
+------------------------+
| [X] [Fb]              |
| © 2026 BeProud Inc.   |
+------------------------+
```

## Props 相当の入力データ

```ts
type FooterLink = { label: string; href: string; external?: boolean };
type FooterGroup = { title: string; links: FooterLink[] };

type FooterProps = {
  groups: FooterGroup[];
  social: { twitter?: string; facebook?: string };
  copyright: string;            // "© 2026 BeProud Inc."
  showLanguageSwitcher?: boolean; // 日本語/English
};
```

実データ例:
```ts
const groups = [
  { title: 'ヘルプ', links: [
    { label: 'ご利用ガイド', href: '/guide/' },
    { label: 'よくある質問', href: '/faq/' },
    { label: 'お問い合わせ', href: '/contact/' },
  ]},
  { title: 'ビジネス', links: [
    { label: '広告掲載', href: '/ad/' },
    { label: '利用規約', href: '/term/' },
    { label: '運営会社', href: 'https://www.beproud.jp/', external: true },
    { label: 'API', href: '/about/api/' },
  ]},
  ...
];
```

## 状態バリエーション

| 状態 | 表示の差分 |
|---|---|
| default | 通常表示 |
| hover (リンク) | テキストにアンダーライン・色変化 |
| focus | フォーカスリング (キーボードナビ) |
| mobile-collapsed | グループタイトルのみ表示、▼ アイコン |
| mobile-expanded | アコーディオン展開、リンク群表示 |
| empty | links 配列が空のグループは非表示 |
| dark-mode | 背景: ダークグレー、テキスト: ライトグレー |

connpass の標準フッターには loading / error 状態はなく静的。

## レスポンシブでの変化

- **>= 1024px**: 4–5 カラムでグループを横並び。Grid layout (`grid-template-columns: repeat(4, 1fr)`)
- **768px–1023px**: 2 カラムに集約
- **< 768px**: 1 カラム + アコーディオン (`<details>` ベース推奨)
- SNS アイコンと著作権表示は常に最下段に独立行で表示
- フォントサイズは 12px–14px、行間 1.6

## アクセシビリティ要件

- 要素: `<footer role="contentinfo">`
- 各リンク群: `<nav aria-label="ヘルプ">` のように aria-label でグループ名を付与
- リンクは `<ul><li><a>` の構造でリスト化、スクリーンリーダーに件数を伝える
- 外部リンクは `target="_blank" rel="noopener noreferrer"` と `aria-label="新しいタブで開く"` を補足
- アコーディオン (モバイル): `<details><summary>` を使うか、`<button aria-expanded aria-controls>` で実装
- SNS アイコン: `aria-label="Twitter公式アカウントへ"` のように具体的な目的を記述
- 色コントラストは WCAG AA (4.5:1) を満たす

## 推測される HTML 構造と CSS 設計の方針

```html
<footer class="c-footer" role="contentinfo">
  <div class="c-footer__groups">
    <nav class="c-footer__group" aria-label="ヘルプ">
      <h2 class="c-footer__title">ヘルプ</h2>
      <ul>
        <li><a href="/guide/">ご利用ガイド</a></li>
        <li><a href="/faq/">よくある質問</a></li>
        <li><a href="/contact/">お問い合わせ</a></li>
      </ul>
    </nav>
    <!-- 他のグループ -->
  </div>
  <div class="c-footer__bottom">
    <ul class="c-footer__social">
      <li><a href="https://x.com/connpass_info" aria-label="X(Twitter)公式"><svg/></a></li>
      <li><a href="https://www.facebook.com/connpass.info" aria-label="Facebook公式"><svg/></a></li>
    </ul>
    <p class="c-footer__copy">&copy; 2026 BeProud Inc.</p>
  </div>
</footer>
```

CSS 方針:
- グループは CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))`
- カラー: `--color-footer-bg`, `--color-footer-text`, `--color-footer-link`
- 上部に薄いセパレーター (`border-top: 1px solid var(--color-border)`)
- パディング: `padding: 48px 24px`
- リンクは `text-decoration: none` 基本、hover で underline
- モバイル時の `<details>` には `summary::-webkit-details-marker` を非表示にし、独自で ▼/▲ を出す

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// Footer.tsx
type FooterProps = {
  groups: FooterGroup[];
  social: SocialLinks;
  copyright: string;
};

export function Footer({ groups, social, copyright }: FooterProps) {
  return (
    <footer className={styles.root} role="contentinfo">
      <div className={styles.groups}>
        {groups.map(group => (
          <FooterGroup key={group.title} group={group} />
        ))}
      </div>
      <FooterBottom social={social} copyright={copyright} />
    </footer>
  );
}

// FooterGroup.tsx — モバイルでは details に切替
function FooterGroup({ group }: { group: FooterGroup }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  if (isMobile) {
    return (
      <details className={styles.group}>
        <summary>{group.title}</summary>
        <ul>{group.links.map(l => <FooterLinkItem key={l.href} {...l} />)}</ul>
      </details>
    );
  }
  return (
    <nav aria-label={group.title} className={styles.group}>
      <h2>{group.title}</h2>
      <ul>{group.links.map(l => <FooterLinkItem key={l.href} {...l} />)}</ul>
    </nav>
  );
}
```

設計のポイント:
- データ駆動 (`groups` を props で受け取る) でテスト容易性を確保
- リンク定義はサイト共通の `src/config/footer.ts` に集約
- 外部リンクは `<FooterLinkItem>` 内で `rel="noopener noreferrer"` を自動付与
- SSR で完全描画 (CLS 防止)
- ダークモード切り替えは CSS 変数で制御
- テスト: 全リンクが描画されること、`<footer>` role が contentinfo、外部リンクに rel が付くこと
