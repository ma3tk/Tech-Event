# event-detail-header — イベント詳細ヘッダー

## 役割と利用箇所

イベント詳細ページ `/event/{id}/` (および各グループサブドメイン `{group}.connpass.com/event/{id}/`) の最上部に表示される、イベントの "顔" となる領域。タイトル、副題、開催日時、開催場所、主催者、参加費、募集状況、ステータスバッジ、メインの参加 CTA、シェアボタンを集約する。

主な利用箇所:
- `/event/{id}/` — メイン詳細
- `/event/{id}/participation/` の上部 (簡略版が再利用)
- `/event/{id}/feed/` 等のサブページにも同種のヘッダーが表示

connpass 実例 (setk.connpass.com/event/356828/):
- タイトル: 「【2025年版・第6回】プロジェクトマネージャ試験勉強会」
- 副題: 「生成AIに助けてもらってPM試験の合格を目指す勉強会」
- 開催日時: 「2025/06/28(土) 09:00 〜 12:00」
- 会場: 「Discord会場」(オンライン)
- 主催者: 「Quatrex」
- 参加費: 「無料」
- 募集状況: 「先着順 3/5人」
- ステータス: 「終了」

## 視覚的構造

### デスクトップ

```
+----------------------------------------------------------------------+
| パンくず: connpass > グループ名 > イベントタイトル                       |
+----------------------------------------------------------------------+
| +-----------------+   [終了]                                          |
| |                 |   グループ名 (リンク)                              |
| |   cover image   |   ## 【2025年版・第6回】プロジェクトマネージャ試験勉強会 |
| |   (1200x630)    |   副題: 生成AIに助けてもらってPM試験の合格を目指す   |
| |                 |   #PM試験 #勉強会  (タグ)                          |
| +-----------------+                                                  |
|                                                                      |
|  [📅 2025/06/28(土) 09:00–12:00]  [📍 Discord会場 (オンライン)]       |
|  [👤 主催: Quatrex]              [💴 無料]                           |
|  [👥 先着順 3/5人]                                                    |
|                                                                      |
|  [シェア: X | FB | はてブ]   [カレンダー追加]                          |
|                                                                      |
|  +---------------------------------------------+                     |
|  |   [ 参加申し込み (募集中) ]                   |  ← primary CTA      |
|  |   または [キャンセル待ち][参加をキャンセル]    |                     |
|  +---------------------------------------------+                     |
+----------------------------------------------------------------------+
```

### モバイル

```
+--------------------+
| パンくず            |
+--------------------+
| [cover image]      |
+--------------------+
| [終了]              |
| グループ名          |
| ## タイトル         |
| 副題                |
| 📅 日時             |
| 📍 場所             |
| 👤 主催: Quatrex    |
| 👥 3/5人            |
| 💴 無料             |
+--------------------+
| シェア              |
+--------------------+
| [ 参加申し込み ]    |  ← sticky 化
+--------------------+
```

## Props 相当の入力データ

```ts
type EventDetailHeaderProps = {
  event: {
    id: string;
    title: string;
    subtitle?: string;
    coverImageUrl?: string;
    startedAt: string;
    endedAt: string;
    timezone?: string;
    place:
      | { type: 'offline'; venue: string; address: string; mapUrl?: string }
      | { type: 'online'; platform: string }
      | { type: 'hybrid'; venue: string; platform: string };
    organizer: { id: string; nickname: string; avatarUrl?: string };
    group: { id: string; name: string; subdomain: string; iconUrl?: string };
    fee: number | 'free';
    capacity?: number;
    accepted: number;
    waitlisted?: number;
    selectionType: 'first-come' | 'lottery';
    status: 'open' | 'full' | 'waitlist' | 'closed' | 'cancelled' | 'ended' | 'upcoming';
    tags?: string[];
  };
  currentUserStatus?: 'none' | 'attending' | 'waitlist' | 'cancelled';
  onApply?: () => void;
  onCancel?: () => void;
  onShare?: (target: 'x' | 'facebook' | 'hatena') => void;
};
```

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| open (募集中) | 緑バッジ「募集中」、CTA 「参加申し込み」プライマリ |
| full (満員) | 赤バッジ「満員」、CTA は「補欠登録」または無効化 |
| waitlist | 黄バッジ、CTA 「補欠登録する」 |
| closed (締切) | グレーバッジ「募集締切」、CTA 無効 |
| cancelled (中止) | 赤バッジ「中止」、CTA 非表示、警告メッセージ表示 |
| ended (終了) | グレー「終了」、CTA→「資料を見る」「アンケート回答」 |
| upcoming (公開前/予告) | バッジ「開催前」、CTA「リマインダー設定」 |
| currentUser: attending | CTA→「参加をキャンセルする」(secondary) |
| currentUser: waitlist | 「補欠登録中」表示 + キャンセルボタン |
| loading (申込中) | CTA にスピナー、disabled |
| error (申込失敗) | エラーメッセージをトースト or バナーで表示 |
| guest (未ログイン) | CTA クリックでログインモーダル/ページへ誘導 |

## レスポンシブでの変化

- **>= 1024px**: 2 カラム (cover image 左 / メタ情報右) または上下分割。CTA はメタ情報下に大きく配置
- **768px–1023px**: 1 カラム、cover は上に大きく
- **< 768px**: 全幅画像、メタ情報を縦並び。CTA はスクロール時 `position: fixed; bottom: 0` で常時表示 (sticky CTA バー)
- 日付/場所/参加費はアイコン + テキストのチップ形式で wrap

## アクセシビリティ要件

- 全体: `<header role="banner">` ではなく `<section aria-labelledby="event-title">` (page heading として `<h1 id="event-title">` を持つ)
- タイトルは `<h1>` (ページ内最上位)
- 日時: `<time datetime="2025-06-28T09:00+09:00">2025/06/28(土) 09:00</time>` を 2 つ並べる (start/end)
- 場所: オフラインなら `<address>` でラップ、Google Maps リンクには `aria-label="地図で場所を確認 (新しいタブ)"`
- ステータスバッジ: 色だけでなくテキストを持たせる
- CTA ボタン: `<button>` で実装、状態に応じ `aria-disabled`、ローディング時 `aria-busy="true"` + スピナーに `aria-live="polite"`
- シェア: 各ボタンに `aria-label="Xで共有"` のように明示
- フォーカス順序: パンくず → タイトル → メタ → CTA → シェア
- カラーコントラスト: バッジは AA 準拠 (4.5:1)
- スクリーンリーダー向けに「3人参加、定員5人」のような文章を `aria-label` または `<span class="visually-hidden">` で補足

## 推測される HTML 構造と CSS 設計の方針

```html
<section class="c-event-header" aria-labelledby="event-title">
  <nav class="c-breadcrumb" aria-label="パンくず">...</nav>
  <div class="c-event-header__cover">
    <img src="..." alt="" />
    <span class="c-badge c-badge--ended">終了</span>
  </div>
  <div class="c-event-header__body">
    <a href="/series/123/" class="c-event-header__group">システムエンジニア友の会</a>
    <h1 id="event-title" class="c-event-header__title">
      【2025年版・第6回】プロジェクトマネージャ試験勉強会
    </h1>
    <p class="c-event-header__subtitle">生成AIに助けてもらって...</p>
    <ul class="c-event-header__tags">
      <li><a href="/tag/PM試験/" class="c-tag">PM試験</a></li>
    </ul>
    <dl class="c-event-header__meta">
      <div>
        <dt>開催日時</dt>
        <dd><time datetime="...">2025/06/28(土) 09:00</time> 〜 <time datetime="...">12:00</time></dd>
      </div>
      <div>
        <dt>会場</dt>
        <dd><address>Discord会場 (オンライン)</address></dd>
      </div>
      <div><dt>主催</dt><dd><a href="/user/quatrex/">Quatrex</a></dd></div>
      <div><dt>参加費</dt><dd>無料</dd></div>
      <div><dt>定員</dt><dd>先着順 <strong>3</strong> / 5 人</dd></div>
    </dl>
    <div class="c-event-header__actions">
      <button class="c-btn c-btn--primary">参加申し込み</button>
      <ul class="c-event-header__share">
        <li><button aria-label="Xで共有">X</button></li>
        <li><button aria-label="Facebookで共有">FB</button></li>
        <li><button aria-label="はてブで共有">B!</button></li>
      </ul>
    </div>
  </div>
</section>
```

CSS 方針:
- セクション全体は `display: grid; grid-template-columns: 360px 1fr; gap: 32px;` (デスクトップ)
- モバイル: `grid-template-columns: 1fr`
- カバー画像: `aspect-ratio: 1200/630; object-fit: cover; border-radius: 8px`
- ステータスバッジ: 画像左上に絶対配置
- CTA ボタンは min-height 48px、太字、視認性重視
- モバイル sticky CTA: `position: fixed; bottom: 0; left: 0; right: 0; box-shadow: 0 -2px 8px rgba(0,0,0,.08); z-index: 100;`
- メタ情報 dl は 2 カラムグリッド、dt は灰文字

## 模倣実装するなら React コンポーネントとしてどう設計するか

```tsx
// EventDetailHeader.tsx
export function EventDetailHeader({ event, currentUserStatus, onApply, onCancel, onShare }: Props) {
  const status = event.status;
  return (
    <section className={styles.root} aria-labelledby="event-title">
      <Breadcrumb items={[
        { label: 'connpass', href: '/' },
        { label: event.group.name, href: `/series/${event.group.id}/` },
        { label: event.title },
      ]}/>
      <Cover src={event.coverImageUrl} status={status} />
      <div className={styles.body}>
        <GroupLink group={event.group} />
        <h1 id="event-title">{event.title}</h1>
        {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
        <TagList tags={event.tags} />
        <EventMetaList event={event} />
        <ApplyCta
          status={status}
          currentUserStatus={currentUserStatus}
          onApply={onApply}
          onCancel={onCancel}
        />
        <ShareButtons onShare={onShare} />
      </div>
    </section>
  );
}
```

設計のポイント:
- 子コンポーネント `Breadcrumb`, `Cover`, `EventMetaList`, `ApplyCta`, `ShareButtons`, `TagList` を分割し再利用
- ステータス→CTA ラベル/色のマッピングは `getCtaConfig(status, currentUserStatus)` という純関数で
- 申込ボタンは Server Action / API 呼び出しを行う `useApplyMutation()` フックを利用
- 楽観的更新 (申込直後に accepted +1)、失敗時に rollback
- sticky CTA は `useIntersectionObserver` でメインCTAが画面外に出たら表示
- カバー画像は `next/image priority` で LCP 最適化
- 日時表示は dayjs/luxon + ja ロケール
- Storybook で全ステータスのバリアントを作成
- ログイン状態に応じた条件分岐 (`useSession()`) は親レイヤーから注入
