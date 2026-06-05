# Motion 規約 — duration / easing の使い分け

`tech-event` のアニメーション・トランジションは `src/styles/tokens.css` で定義された
motion トークンを通じて統一されています。生の `300ms` や `cubic-bezier(...)` を
コンポーネント内に直接書くことは禁止です。

## 1. Duration スケール

| トークン | 値 | Tailwind utility | 使い所 |
| --- | --- | --- | --- |
| `--duration-instant` | `0ms`   | `duration-instant` | アニメーション無効化 (reduced-motion フォールバック) |
| `--duration-fast`    | `150ms` | `duration-fast`    | **button hover / focus / color 変化** — 反応の良さを優先 |
| `--duration-normal`  | `200ms` | `duration-normal`  | **card hover / tooltip / dropdown** — 標準。迷ったらこれ |
| `--duration-slow`    | `300ms` | `duration-slow`    | **dialog / drawer / sheet open-close** — 注目を引きたい時 |
| `--duration-slower`  | `500ms` | `duration-slower`  | page / route transition のような大物 |

### 根拠

- 100ms 未満は人間が「アニメーション」として認識しないので使わない (= instant 同等)
- 200ms は Material Design / iOS HIG ともに「標準遷移」として推奨されている値
- 500ms 超は「遅い」と感じられ離脱率に影響するので避ける

## 2. Easing スケール

| トークン | 値 | Tailwind utility | 使い所 |
| --- | --- | --- | --- |
| `--ease-linear`  | `linear`                          | `ease-linear` | progress bar、スピナー (等速が望ましいもの) |
| `--ease-in`      | `cubic-bezier(0.4, 0, 1, 1)`      | `ease-in`     | **退場**: 要素が画面外へ消える時 |
| `--ease-out`     | `cubic-bezier(0, 0, 0.2, 1)`      | `ease-out`    | **入場**: 要素が現れる時 (デフォルト推奨) |
| `--ease-in-out`  | `cubic-bezier(0.4, 0, 0.2, 1)`    | `ease-in-out` | **位置の変化**: 要素が画面内を移動する時 |
| `--ease-spring`  | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `ease-spring` | **強調**: badge pop、attention 喚起。overshoot あり |

### 選び方フローチャート

```
要素は現れる?         → ease-out
要素は消える?         → ease-in
要素は移動するだけ?   → ease-in-out
注意を引きたい?       → ease-spring
等速が必要?           → ease-linear
```

## 3. prefers-reduced-motion 対応

**必須**: 全ての transition / animation は `prefers-reduced-motion: reduce` で
無効化されなければなりません。`tokens.css` 側で `--duration-*` を `0ms` に上書き
する一次対策と、`globals.css` 側の `*{ transition-duration: 0.001ms !important }`
セーフネットの 2 段構えで実装しています。

開発者は **トークン参照さえしていれば自動的に reduced-motion 対応** になります。
逆に言うと `transition-duration: 300ms` のような直接値は reduced-motion を壊すので
禁止です。

## 4. 推奨パターン

### 4.1 Button (hover / focus)

```tsx
// ❌ Before — マジックナンバー
className="transition-all duration-200"

// ✅ After — トークン参照
className="transition-colors duration-fast ease-out"
```

`button` の hover は色変化だけなので `transition-colors` (= color, background-color,
border-color のみ) で十分。 `transition-all` は意図しないプロパティまで巻き込むので
非推奨。

### 4.2 Card (hover で持ち上がる)

```tsx
// 標準パターン
className={cn(
  "transition-[transform,box-shadow] duration-normal ease-out",
  "hover:-translate-y-0.5 hover:shadow-md"
)}
```

`transition-all` ではなく **動かしたいプロパティを明示**。 200ms / ease-out で
「軽く浮く」表現が出ます。

### 4.3 Dialog / Drawer (open-close)

Radix UI ベースのコンポーネントは `data-[state=open]` / `data-[state=closed]` の
属性切替で開閉します。

```tsx
className={cn(
  "duration-slow ease-out",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
)}
```

300ms 程度かけて落ち着いた挙動にすることで、モーダルへの注意を促します。

### 4.4 Spring (badge pop / 強調)

```tsx
// 新着 / NEW 表示などに
className="transition-transform duration-normal ease-spring hover:scale-110"
```

`ease-spring` は overshoot するので、**色やフェードには使わない** (色が overshoot
すると見栄えが悪い)。`transform` や `scale` 専用と覚えてください。

## 5. アンチパターン

| ❌ NG | ✅ OK | 理由 |
| --- | --- | --- |
| `transition-all duration-200` | `transition-colors duration-fast` | プロパティ明示 + トークン名 |
| `transition: all 300ms` (生 CSS) | tokens を使う | reduced-motion 非対応 / 値ハードコード |
| `duration-[250ms]` | `duration-normal` (200ms) | 標準スケールから外れている |
| `ease-[cubic-bezier(0.1,0.7,0.5,1)]` | `ease-out` 等 | カスタム curve は禁止 |
| `transition-all` + `hover:scale-105` + `hover:bg-red` | `transition-[transform,background-color]` | all は色とtransformで挙動が崩れる |

## 6. 既存コンポーネントの移行

motion トークン規約導入時点で、 `Button` と `EventCard` / `EventListRow` は
規約準拠の duration / ease に置換済みです。他のコンポーネントは段階的に移行
してください。チェックリスト:

- `transition-all` を **prop 明示型** (`transition-colors` / `transition-transform` 等) に変える
- `duration-150/200/300` のような raw 値を `duration-fast/normal/slow` に変える
- 必要なら `ease-out` を明示する (Tailwind デフォルトは linear ではなく ease になっているが、ブラウザ実装差を排除するため明示推奨)
- 動作確認: ブラウザの DevTools で `prefers-reduced-motion` を `reduce` にしてアニメーション無効化を確認

## 7. Storybook での確認

`Design System / Motion` を Storybook で開くと、各 duration / easing の実物デモが
動きます。新しいコンポーネントを作るときの参照値として使ってください。

## 8. 参考

- [Material Design 3 — Motion overview](https://m3.material.io/styles/motion/overview)
- [WAI ARIA — Animation accessibility](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- `src/styles/tokens.css` の motion セクション
- `tokens/motion.json` (Figma Tokens Studio 連携用)
