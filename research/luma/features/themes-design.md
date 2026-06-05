# Luma Themes & Design Customization

## 概要

Luma の独自体験「**イベントごとに UI 全体が変わる**」を実現する機能群。背景色・グラデ・フォント・エフェクトを 1 つの設定パネルで操作し、CSS Variables 経由でページ全体に瞬時反映。これにより、テックイベントが**個別ブランド**を持てるようになり、Twitter シェア時にも目を引く。

## カスタマイズ階層

```
Organization
  ↳ Calendar — デフォルトテーマ (全イベントに継承)
      ↳ Event — 個別オーバーライド可
```

ホストが「全イベント統一感を出す」も「1 イベントだけ特別」もできる。

## テーマパラメータ全部

```ts
type EventTheme = {
  // プリセット
  preset?: 'minimal' | 'midnight' | 'pastel' | 'sunset' | 'neon' | 'nature' | 'custom';

  // 色
  tintColor: string;            // メイン色 (CTA / リンク)
  backgroundMode: 'solid' | 'gradient' | 'image';
  backgroundSolid?: string;
  backgroundGradient?: {
    from: string;
    to: string;
    angle: number;              // 0-360
  };
  backgroundImageUrl?: string;
  backgroundBlur?: number;      // 0-40 px

  // タイポグラフィ
  fontFamily: 'inter' | 'serif' | 'mono' | 'rounded' | 'display';
  fontWeight?: 'regular' | 'medium' | 'semibold';
  fontSize: 'sm' | 'md' | 'lg';

  // エフェクト (動的演出)
  effect?: 'none' | 'sparkles' | 'snowfall' | 'confetti' | 'fireflies' | 'aurora';
  effectIntensity?: 'subtle' | 'normal' | 'intense';

  // ダーク / ライト
  colorScheme: 'auto' | 'light' | 'dark';

  // 詳細
  cornerRadius: 'sharp' | 'rounded' | 'extra-rounded';
};
```

## プリセット一覧

| プリセット | 雰囲気 | 例 |
| --- | --- | --- |
| Minimal | クリーン | white / black / Inter |
| Midnight | プロフェッショナル | navy gradient / Inter |
| Pastel | カジュアル | pink-mint / Rounded sans |
| Sunset | クリエイティブ | orange-magenta / Display serif |
| Neon | テック / クリプト | dark + neon cyan / Mono |
| Nature | ウェルネス | sage green / Serif |
| Holiday | 季節限定 | 雪 + 赤緑グラデ |

## 適用範囲

テーマは以下に反映される:

- イベント詳細ページ全体
- Register ボタンの色
- カレンダー追加リンク色
- 招待メールの header / button 色
- OG プレビュー画像 (動的生成)
- Calendar feed の widget

## CSS Variables 注入

ページの `<html>` ルートに以下を出力:

```html
<html style="
  --luma-tint: #5C66FF;
  --luma-bg: linear-gradient(135deg, #5C66FF, #0a0a0a);
  --luma-font: 'Inter', sans-serif;
  --luma-radius: 16px;
">
```

各コンポーネントは `var(--luma-tint)` を参照するだけ。テーマ切替が瞬時に反映。

## エフェクトの実装

- Canvas / SVG オーバーレイで実装 (`<canvas class="luma-effect-layer" />`)
- requestAnimationFrame ベース、60fps
- `prefers-reduced-motion: reduce` でユーザー側オフ可能
- 低性能デバイス (CPU 制限あり) で自動 throttle

例: Sparkles
- 画面上にランダム位置で星形が fade in/out
- 1 秒に 5 個生成、3 秒で消える
- パーティクル最大 30 個まで

## 動的 OG 画像生成

イベントの cover + title + tintColor を元に、Luma が自動生成する OG プレビュー画像:

```
https://luma.com/og/{event_id}.png
```

これにより、Twitter / iMessage シェア時の見栄えがイベントごとに個別化される。Vercel OG image / Cloudflare Image Resizing 系のテクニックを使用。

## カスタムフォント (Plus 限定)

- Google Fonts から選択 (50 種類くらい)
- アップロード WOFF2 にも対応 (Pro 検討中)
- ヘッダー / 本文 / モノスペースを個別指定

## カスタム CSS (Pro 検討中)

- 一部 enterprise 顧客のみ
- 任意 CSS スニペット注入
- 通常はテーマパネルで十分

## A11y

- コントラスト警告: 編集時に背景 vs 文字のコントラストが WCAG AA 未満なら yellow warning
- `prefers-reduced-motion` で effect 完全 off
- `prefers-color-scheme: dark` で colorScheme: auto なら dark へ自動切替
- フォントサイズ "lg" は本文を 17px に上げ、視認性配慮

## レスポンシブ

- テーマは全デバイスで同じ値
- ただし effect は mobile で自動 throttle (バッテリー保護)
- 背景画像はモバイルで解像度落とした版を配信 (`?w=750` 等)

## 真似すべきポイント

1. **「テーマ = 1 オブジェクト」設計** — 単一 JSON でページ全体を制御
2. **CSS Variables 注入だけで実現** — 各コンポーネントを書き換えなくて済む
3. **プリセット 6 種** — ほとんどのホストは選ぶだけで満足
4. **動的 OG 画像** — シェア体験を個別化
5. **コントラスト警告 UI** — A11y を強制せず教育的に
6. **effect の prefers-reduced-motion 対応** — A11y と派手さの両立

## connpass との比較

connpass はホスト側のカスタマイズが「グループのトップ画像差し替え」程度。Luma は CSS Variables + JSON テーマで**完全な視覚カスタマイズ**を提供している。ここが「テックイベントは Luma へ」という流れを生んだ最大要因。
