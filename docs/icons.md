# tech-event アイコン規約

本ドキュメントは `tech-event` で使用するアイコンの選定基準、サイズ、用途、アクセシビリティ規約をまとめたものである。
実装は `lucide-react` を単一ソースとし、追加の依存は導入しない。

> 関連: `docs/design-system.md` § 9 (アイコン)、Storybook `Design System/Icons`、`src/stories/design-system/Icons.mdx`

---

## 1. ライブラリ

- 採用: **[`lucide-react`](https://lucide.dev/) v1 系**
- 採用理由:
  - SVG ベース。`currentColor` を継承するため Tailwind トークンと相性が良い。
  - ストロークウェイト固定 (`stroke-width=2`) のため統一感が出る。
  - tree-shaking 可能 (個別 import)。
  - tabler / heroicons などと比較してビジュアル密度が中庸で、connpass 系の情報密度 UI に合う。
- **追加依存は不要**。新しいアイコンライブラリ (heroicons, tabler-icons, react-icons, font awesome 等) の混在は禁止。
- インポートは個別名指しのみ:

```tsx
// OK
import { Calendar, MapPin, Users } from "lucide-react";

// NG (バンドルサイズが膨らむ)
import * as Icons from "lucide-react";
```

---

## 2. サイズ

| サイズ | Tailwind ユーティリティ | 用途 | 例 |
| --- | --- | --- | --- |
| **14px** | `h-3.5 w-3.5` | 行内インラインの装飾、メタ情報 (時刻 / 件数の頭) | `<Clock className="h-3.5 w-3.5" />` |
| **16px** | `h-4 w-4` | デフォルト。ボタン左右、入力アイコン、ナビ項目 | `<Calendar className="h-4 w-4" />` |
| **20px** | `h-5 w-5` | やや強調。ヘッダーナビ、Dropdown trigger、空状態 | `<Bell className="h-5 w-5" />` |
| **24px** | `h-6 w-6` | ロゴ近傍、ヒーロー、エラー画面 | `<Sparkles className="h-6 w-6" />` |

**14 / 16 / 20 / 24 以外は使わない**。Hero illustration として 32 / 48 を例外的に使う場合は SVG 直書きで対応 (lucide は基本 24 ベースのため拡大すると線が細く見える)。

### サイズと文字サイズの対応

| 隣接テキスト | アイコンサイズ |
| --- | --- |
| `text-xs` (12px) / `text-sm` (14px) | 14px (`h-3.5 w-3.5`) |
| 標準本文 / フォーム入力 | 16px (`h-4 w-4`) |
| `text-lg` (18px) / `text-xl` (20px) | 20px (`h-5 w-5`) |
| 見出し (`h1`/`h2`) | 24px (`h-6 w-6`) |

---

## 3. ストローク (線の太さ)

- lucide のデフォルト `stroke-width=2` をそのままは使わず、本デザインシステムでは **`strokeWidth={1.5}`** で統一する。
  - 理由: `EventCard` / `EventListRow` の情報密度が高い画面で、`2` だとアイコンが目立ちすぎる。
  - 例外: ボタン内アイコン (`Button` 子要素) のみ、デフォルト 2 を許可 (CTA の主張を保つ)。

```tsx
// 推奨: メタ情報・ナビ
<MapPin strokeWidth={1.5} className="h-4 w-4" />

// 例外: CTA ボタン (太め可)
<Button>
  <Plus className="h-4 w-4" /> イベントを作成
</Button>
```

実装上は `Button` / `Link` の子に置く場合のみ stroke 指定省略 OK。それ以外は明示する。

---

## 4. カラー

- 原則 `currentColor` 継承 (= 親の `text-*` を引き継ぐ)。
- 強調する場合は親に `text-brand-orange` / `text-status-open-fg` 等を当てる。
- 色だけで状態を表現しないこと (テキスト or `aria-label` を必ず併記)。

| 文脈 | 親に当てる color クラス | 例 |
| --- | --- | --- |
| デフォルト本文 | `text-foreground` | 一覧の `Calendar` アイコン |
| 補助情報 | `text-muted-foreground` | メタ行の `Clock`、`Users` |
| ブランド強調 | `text-brand-orange` | ロゴ脇の `Sparkles`、CTA |
| リンク | `text-link` | `ExternalLink` 付きリンク |
| ステータス | `text-status-{name}-fg` | バッジ内のドット |
| 警告 / エラー | `text-brand-red` | `Trash2`、削除確認 |

---

## 5. 用途別ガイド

アイコンは **用途別** に役割を分け、それぞれで選定基準が異なる。

### 5.1 Action icons — 操作を促す

ボタン / リンクの中で「クリック後に何が起きるか」を視覚的に補強する。

- 動詞的なアイコン (`Plus`, `Trash2`, `Edit`, `Share2`, `Copy`, `Search`)。
- ボタン内では基本 16px、左に置く (右はチェブロン等のヒント用途のみ)。
- `aria-hidden="true"` を付ける (テキストと併存するため意味は重複)。

```tsx
<Button>
  <Plus className="h-4 w-4" aria-hidden /> 新規作成
</Button>
```

### 5.2 Status icons — 状態を伝える

イベント状態、バッジ、トースト、エラー画面で「何が起きているか」を瞬時に伝える。

- 名詞 / 形容詞的なアイコン (`Check`, `X`, `Info`, `AlertTriangle`, `Circle`)。
- 色だけで判別させない。必ずテキストラベルを併記。
- スクリーンリーダーには `role="status"` の親で読み上げさせ、アイコンは `aria-hidden`。

```tsx
<div role="status" className="text-status-open-fg flex items-center gap-1">
  <Check className="h-4 w-4" aria-hidden /> 募集中
</div>
```

### 5.3 Nav icons — ナビゲーション

ヘッダー / フッター / サイドバー / Tabs。位置や移動方向を示す。

- `ChevronLeft` / `ChevronRight` / `ChevronDown` / `ChevronUp` / `Menu` / `X` / `Home`。
- 単独で意味を持つ場合 (= テキストが無いハンバーガーボタン等) は `aria-label` を必須化。
- Tabs / Breadcrumb の区切りは `ChevronRight` 統一。

```tsx
// ハンバーガーボタン — aria-label 必須
<button aria-label="メニューを開く">
  <Menu className="h-5 w-5" aria-hidden />
</button>
```

### 5.4 Decoration icons — 装飾

ヒーロー、空状態、空サムネ、レコメンド見出しで雰囲気を作る。

- `Sparkles`, `Flame`, `Heart`, `Star`, `Sun`, `Moon`, `Monitor`。
- 必ず `aria-hidden="true"`。意味を持たせない。
- 色は `text-brand-orange-soft` の上の `text-brand-orange` など、淡色背景とのペアで使う。

---

## 6. 機能 vs 装飾の判別と `aria-hidden`

| 状況 | aria-hidden | aria-label | 隣接テキスト |
| --- | --- | --- | --- |
| テキストの**横**にアイコン (ボタン / リンク内) | `true` | 不要 | あり |
| アイコン**単独**ボタン (ハンバーガー / 閉じる) | `true` (絵は隠す) | **必須** (ボタンに付ける) | なし |
| 装飾 (ヒーロー / 空状態) | `true` | 不要 | あり / なし |
| ステータスドット (色のみで意味) | `true` | 親要素に `aria-label` or 隣接テキスト | あり |

```tsx
// 1. 横並び — アイコンは隠す
<Button>
  <Calendar className="h-4 w-4" aria-hidden="true" /> 予定に追加
</Button>

// 2. 単独ボタン — ボタン側に aria-label
<button aria-label="閉じる" onClick={...}>
  <X className="h-5 w-5" aria-hidden="true" />
</button>

// 3. 装飾
<div className="empty-state">
  <Calendar className="h-12 w-12 text-muted" aria-hidden="true" />
  <p>まだイベントがありません</p>
</div>
```

---

## 7. 使ってよいアイコン一覧 (50)

下記は本リポジトリで採用する公式アイコン。他のアイコンを追加する場合は、PR でこの一覧に追記すること (= 暗黙的な追加禁止)。

### 7.1 Action (操作)

| アイコン | 用途 | サイズ目安 |
| --- | --- | --- |
| `Plus` | 新規作成 | 16 |
| `Trash2` | 削除 | 16 |
| `Pencil` | 編集 | 16 |
| `Search` | 検索 | 16 / 20 |
| `Share2` | 共有 | 16 |
| `Copy` | コピー | 16 |
| `ExternalLink` | 別タブ遷移 | 14 / 16 |
| `Download` | ダウンロード | 16 |
| `Upload` | アップロード | 16 |
| `Funnel` | フィルタ | 16 |
| `RefreshCw` | 再読込 | 16 |
| `LogOut` | ログアウト | 16 |
| `Settings` | 設定 | 16 |

### 7.2 Status (状態)

| アイコン | 用途 |
| --- | --- |
| `Check` | 完了 / 選択 / 出席 |
| `X` | 閉じる / キャンセル / 否決 |
| `Info` | 情報通知 |
| `TriangleAlert` | 警告 |
| `CircleAlert` | エラー |
| `CircleCheck` | 成功 (絵柄付き) |
| `Circle` | 未選択 (RadioGroup 等) |
| `Minus` | 中間状態 (Checkbox indeterminate) |
| `Clock` | 受付時間 / 待機 |
| `Bell` | 通知 |

### 7.3 Nav (ナビゲーション)

| アイコン | 用途 |
| --- | --- |
| `ChevronLeft` | 前へ |
| `ChevronRight` | 次へ / Breadcrumb 区切り |
| `ChevronDown` | プルダウン / アコーディオン展開 |
| `ChevronUp` | プルダウン折りたたみ |
| `ArrowLeft` | 戻る |
| `ArrowRight` | 進む |
| `Menu` | ハンバーガーメニュー |
| `House` | トップへ |
| `Ellipsis` | その他メニュー |

### 7.4 Domain (ドメイン — イベント・グループ)

| アイコン | 用途 |
| --- | --- |
| `Calendar` | 日付 / イベント |
| `CalendarPlus` | カレンダー追加 |
| `MapPin` | 会場 / 場所 |
| `Globe` | オンライン / Web |
| `Users` | 参加者 / 定員 |
| `User` | プロフィール / アカウント |
| `Mail` | メール / Magic Link |
| `Heart` | ブックマーク |
| `Tag` | タグ |
| `Building2` | グループ / 会場 |

### 7.5 Decoration (装飾)

| アイコン | 用途 |
| --- | --- |
| `Sparkles` | 新着 / レコメンド |
| `Flame` | 人気 / トレンド |
| `Star` | 注目 / 評価 |
| `Sun` | ライトテーマ |
| `Moon` | ダークテーマ |
| `Monitor` | システムテーマ |
| `Code` | プログラミング系タグ |
| `Coffee` | ミートアップ |

合計 50 種 (推奨セット)。lucide-react は 1000+ アイコンを持つが、本リポジトリでは
本表 (50 種) + § 7.6 Extra (20 種) = **計 70 種** に限定する。

### 7.6 Extra — tech-event 固有 (20 種)

calendar (Luma 由来) / event / group / 配信 / 主催ダッシュボードに特化した拡張セット。
ベース 50 種で表現できない場合のみ採用する。

| アイコン | 用途 |
| --- | --- |
| `CalendarCheck` | 参加確定 / 出席済 |
| `CalendarClock` | 開催予定 / 残り時間 |
| `CalendarX` | 中止 / キャンセル |
| `Presentation` | 発表資料 / セッション |
| `Ticket` | 参加チケット / 有料イベント |
| `QrCode` | チェックイン QR |
| `Bookmark` | お気に入り (ブックマーク) |
| `Eye` | 閲覧数 / 公開 |
| `TrendingUp` | 人気上昇 / 統計 |
| `Trophy` | ランキング 1 位 |
| `MessageCircle` | コメント / Q&A |
| `Send` | メール送信 / 一斉送信 (blast) |
| `Hash` | タグ / ハッシュタグ |
| `Link2` | 共有 URL コピー |
| `AtSign` | @ メンション / Magic Link |
| `Camera` | サムネイル / 写真 |
| `Video` | オンライン配信 |
| `Mic` | 登壇 / スピーカー |
| `Lock` | 限定公開 / 鍵付き |
| `Unlock` | 一般公開 |

合計 50 + 20 = **70 種**。これ以上の追加は本ファイル § 7.7 への PR を必須とする。

---

## 8. アンチパターン

- ❌ 同じ意味で別アイコンを混ぜる (削除に `Trash2` と `XCircle` を両方使う)。
- ❌ アイコンライブラリを 2 つ以上混在させる。
- ❌ アイコン単独ボタンに `aria-label` を付け忘れる。
- ❌ 16px と 18px のように 1-2px だけ違うサイズを使い分ける (14 / 16 / 20 / 24 に揃える)。
- ❌ アイコンに hex を直書きする (`<Calendar color="#c2410c" />`)。`currentColor` 継承で親に `text-*` を当てる。
- ❌ ステータス表現を色 + アイコンだけで完結させる (テキスト必須)。

---

## 9. 検査

- `pnpm tsc --noEmit` で import 解決が通ること。
- `e2e/components-a11y.spec.ts` で `aria-label` 不足が検出されないこと。
- 追加 / 変更時は `src/stories/design-system/Icons.mdx` に列を追加する。
