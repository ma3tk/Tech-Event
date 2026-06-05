# Luma Theme Customization

## 役割

Luma の独自体験「イベントごとに**ページ全体のテーマ**を変えられる」機能を支える UI コンポーネント群。背景色・グラデ・フォント・アニメーションを 1 つの設定パネルで操作し、リアルタイムでイベントページに反映する。connpass にはない、テックイベントに**ブランド表現**を持ち込んだ最大の差別化要素。

## 利用箇所

- イベント作成 / 編集モーダルの右側パネル
- カレンダーの「デフォルトテーマ」設定
- イベントページ表示時 (ユーザーが見る側)

## テーマパラメータ

```ts
type EventTheme = {
  // プリセット
  preset: 'minimal' | 'midnight' | 'pastel' | 'sunset' | 'neon' | 'nature' | 'custom';

  // 個別カスタマイズ
  tintColor: string;                              // hex e.g. #5C66FF
  backgroundMode: 'solid' | 'gradient' | 'image'; // 背景タイプ
  backgroundGradient?: { from: string; to: string; angle: number };
  backgroundImageUrl?: string;
  backgroundBlur?: number;                        // 0-40 px

  // タイポグラフィ
  fontFamily: 'inter' | 'serif' | 'mono' | 'rounded' | 'display';
  fontSize: 'sm' | 'md' | 'lg';

  // エフェクト
  effect?: 'none' | 'sparkles' | 'snowfall' | 'confetti' | 'fireflies';

  // ダーク / ライト
  colorScheme: 'auto' | 'light' | 'dark';
};
```

## プリセット例

| プリセット | tintColor | 背景 | フォント |
| --- | --- | --- | --- |
| Minimal | #0a0a0a | white solid | Inter |
| Midnight | #5C66FF | radial gradient navy → black | Inter |
| Pastel | #FFB7C5 | linear pink → mint | Rounded sans |
| Sunset | #FF6B35 | linear orange → magenta | Display serif |
| Neon | #00F0FF | dark with neon glow | Mono |
| Nature | #58A65C | sage green solid | Serif |

## レイアウト

### 設定パネル (作成時の右側)

```
┌─ Theme ────────────────────────┐
│ [Preset thumbnails 横スクロール] │
│  Minimal · Midnight · Pastel ...│
│                                 │
│ Color                           │
│  [color picker chip]            │
│                                 │
│ Background                      │
│  ○ Solid  ● Gradient  ○ Image  │
│                                 │
│ Font                            │
│  [Inter ▾]                      │
│                                 │
│ Effects                         │
│  None / ✨ / ❄ / 🎊             │
└─────────────────────────────────┘
```

## Props 相当

```ts
type ThemeCustomizerProps = {
  value: EventTheme;
  onChange: (next: EventTheme) => void;
  previewElement?: React.RefObject<HTMLElement>;
};
```

## 状態バリエーション

- **Default (Minimal)** — 黒文字 / 白背景 / Inter
- **Custom** — preset = custom、個別パラメータが有効化
- **Image background** — blur slider が出現
- **Dark colorScheme** — テキスト自動で白に
- **Effect on** — 背景に animated canvas/SVG (パフォーマンス警告あり)

## 実装上のポイント

- CSS Variables で生成 → ページ全体に適用

```css
:root {
  --tint: #5C66FF;
  --bg-gradient: linear-gradient(135deg, #5C66FF, #0a0a0a);
  --font-display: 'Inter', sans-serif;
}
```

- React 側で `<div style={{ '--tint': theme.tintColor }}>` 注入
- effect は `<canvas>` overlay + `prefers-reduced-motion: reduce` で無効化

## レスポンシブ

- 設定パネル: Desktop 右 360px / Mobile はボトムシート
- 適用: 全デバイスで同じ値、ただし effect は低性能デバイスで自動 off

## A11y

- Color picker は hex 直接入力可、`aria-label="Tint color"` 必須
- preset thumbnails は `<button role="radio" aria-checked>`
- effect は `prefers-reduced-motion` で完全停止
- 背景画像 + 文字のコントラストを WCAG AA で警告表示 (Luma の編集時 UI に "Low contrast" warning が出る)

## React 実装案

```tsx
export function ThemeCustomizer({ value, onChange }: ThemeCustomizerProps) {
  return (
    <div className="space-y-6 p-4">
      <PresetGrid value={value.preset} onSelect={(p) => onChange({ ...value, preset: p, ...PRESETS[p] })} />

      <Field label="Color">
        <ColorPicker value={value.tintColor} onChange={(c) => onChange({ ...value, tintColor: c })} />
      </Field>

      <Field label="Background">
        <SegmentedControl
          options={['solid', 'gradient', 'image']}
          value={value.backgroundMode}
          onChange={(m) => onChange({ ...value, backgroundMode: m })}
        />
      </Field>

      <Field label="Font">
        <Select value={value.fontFamily} onChange={(f) => onChange({ ...value, fontFamily: f })}>
          <option value="inter">Inter</option>
          <option value="serif">Serif</option>
          <option value="mono">Mono</option>
          <option value="rounded">Rounded</option>
          <option value="display">Display</option>
        </Select>
      </Field>

      <Field label="Effects">
        <EffectPicker value={value.effect} onChange={(e) => onChange({ ...value, effect: e })} />
      </Field>
    </div>
  );
}
```

## 真似すべきポイント

- 「**ホストが UI を自分のものにできる**」のは Luma の強み No.1
- ハードコードした CSS Variables の差し替えだけで実現できるので導入コスト低
- プリセット 6 種類用意するだけで 90% のホストは満足する。残り 10% に custom を開放
- effect (sparkles 等) を入れると話題化しやすく、SNS シェア時に注目される
