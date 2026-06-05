# Luma 料金 (Pricing) ページ調査メモ

調査日: 2026-06-04
対象URL: https://lu.ma/pricing (301 → https://luma.com/pricing)
備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLから確証が取れず、Help ("Luma Plus Overview", "Enterprise Overview") からの補完を含む。

---

## 1. 概要・目的

`/pricing` は、Luma の **マネタイズの中核** である Plus / Enterprise プランへ誘導するページ。「ホスト獲得を加速させる」というトップの方向性に対し、ここでは「真剣なホスト → 課金ホスト」へのコンバージョン最大化が目的。

ビジネスモデルは2軸:

1. **チケット販売手数料**: Free プランでは有料イベントの売上から 5% (Plus は 0%)
2. **サブスクリプション**: Plus は $59/月 (年払いで14%割引、Enterprise はカスタム)

トランザクションと SaaS のハイブリッドモデルであり、コミュニティ事業者は売上規模次第で Plus 加入が「数イベントで元が取れる」設計。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/pricing` | メインの Pricing ページ |
| `https://luma.com/pricing?billing=annual` | (推測) 年払い切替 |
| `https://luma.com/pricing/enterprise` | (推測) Enterprise 専用 |
| `https://luma.com/contact-sales` | Enterprise 問い合わせ (推測) |

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Sign In]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                          Pricing (H1)                                    │
│                          {Sub copy}                                      │
│                                                                          │
│              [Monthly]  [Annual (Save 14%)]   ← トグル                   │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │     Free       │  │   Luma Plus    │  │  Enterprise    │              │
│  │     $0         │  │   $59/mo       │  │  Custom        │              │
│  │                │  │   (年払い -14%) │  │                │              │
│  │ Unlimited      │  │ All Free +     │  │ All Plus +     │              │
│  │ events/guests  │  │ 0% platform fee│  │ SSO, SLA, etc. │              │
│  │ 500 emails/wk  │  │ 5,000 emails/wk│  │ Hardware       │              │
│  │ 5% fee on paid │  │ Tax collection │  │ scanners       │              │
│  │ Multi PM       │  │ Custom URL     │  │ Custom domain  │              │
│  │ Check-in       │  │ Zapier + API   │  │ Salesforce     │              │
│  │ Coupons        │  │ 5 admins       │  │                │              │
│  │ ...            │  │ Priority Supt. │  │                │              │
│  │ [Get Started]  │  │ [Try Plus]     │  │ [Contact Sales]│              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
│                                                                          │
│  Add-Ons (Email/SMS 配信枠)                                              │
│  - 10K msg/wk: +$50/mo                                                   │
│  - 25K msg/wk: +$200/mo                                                  │
│  - 100K msg/wk: 段階的価格                                                │
│                                                                          │
│  Payment Processing                                                      │
│   "Stripe charges a credit card fee (typically 2.9% + 30 cents)"         │
│                                                                          │
│  FAQ (推測): 何度でも切替可、年払いの返金など                              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Footer                                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 表示される情報項目の網羅リスト

### プラン構成 (実HTMLから確認)
- **Free** (永続無料)
- **Luma Plus** ($59/月、年払いで14%割引)
- **Enterprise** (カスタム)

### Free プランの機能
- Unlimited number of events
- Unlimited number of guests per event
- 週500件まで招待状/ニュースレター配信
- リマインダー: Email, SMS, Push Notification, WhatsApp
- ゲストチェックイン機能
- 複数のクレジットカード, Apple Pay, Google Pay
- 地域決済方法: iDEAL, Konbini, PayNow など
- チケットタイプ, グループ購入, クーポン設定
- 有料イベントで **5% プラットフォーム手数料**

### Luma Plus の追加機能
- 有料イベントで **0% プラットフォーム手数料**
- 週5,000件まで配信
- Tax Collection (税徴収)
- Check-In Manager ロール
- Custom URL
- 管理者5名含む (追加購入可)
- Zapier 自動化
- Luma API アクセス
- Priority Support

### アドオン
- 週10,000件送信: $50/月
- 週25,000件送信: $200/月
- 最大100,000件まで段階的に対応
- 年間請求で最大11%割引

### Enterprise (Help "Enterprise Overview")
- Single Sign-On (SSO)
- Enterprise Security (SOC2 / GDPR レベル)
- Custom Email Sending Domain
- Hardware Scanners for High-Volume Events
- Transferring Tickets (チケット譲渡)
- Set up a Salesforce Integration
- カスタム SLA + 専任サポート

### その他の記載
- "Stripe, our payment processor, charges a credit card fee (typically 2.9% + 30 cents)"
- Enterprise はカスタム機能リスト表示

---

## 5. UIコンポーネント

| 種別 | 用途 |
| --- | --- |
| H1 | Pricing |
| Billing Toggle | Monthly / Annual の切替 |
| Plan Card (3 列) | Free / Plus / Enterprise |
| Feature Checklist | ✓/✗ の機能リスト |
| CTA Button | Get Started / Try Plus / Contact Sales |
| Add-on Table | 配信枠アドオン |
| Footnote | Stripe 手数料注記 |
| FAQ Accordion | 推測 |

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 未ログイン | "Get Started" → /signin?next=/create |
| ログイン × Free | "Try Plus" → Stripe Checkout (推測) |
| ログイン × Plus | "Manage Plus" / "Cancel Plus" → 設定 (推測) |
| Enterprise | "Contact Sales" → 商談フォーム |
| 年払いトグル | カード内の月額表示を年/12 で動的更新 |

---

## 7. インタラクション

- Billing Toggle: 月/年 を切替 (URL 不変、推測)
- "Try Plus": Stripe Checkout に飛び、決済完了でアカウントが Plus 化
- "Contact Sales": フォーム or Calendly モーダル (推測)
- Add-on の購入は Plus 加入後の管理画面で行う (推測)

---

## 8. 推測されるAPIコール

- `GET /api/pricing/plans` — プラン定義 (Cms 管理されている可能性、推測)
- `POST /api/billing/checkout` — Stripe Checkout Session 作成
- `POST /api/billing/portal` — Stripe Customer Portal セッション
- `POST /api/contact-sales` — 営業問い合わせ

---

## 9. 関連リンク・遷移先

- `/help` の Luma Plus セクション
- Help "Cancelling Luma Plus"
- Help "Managing Luma Plus"
- Help "Understanding Import and Event Invite Limits"
- Stripe Customer Portal (外部)

---

## 10. SEOメタ情報・OGP

- `<title>`: "Pricing · Luma" (推測)
- description: プラン概要
- canonical: `https://luma.com/pricing`
- OGP: プラン比較画像 (推測)
- 構造化データ: `schema.org/Offer` × 3 (推測)

---

## 11. レスポンシブ対応

- PC: 3列カード
- タブレット: 2列 + 下に1枚
- スマホ: 1列縦並び (Free, Plus, Enterprise の順、推測)
- Billing Toggle はスマホでも上部固定

---

## 12. A11y観点

- H1 = "Pricing"
- 各プランカードは `<article>` or `<section>` で囲む
- Billing Toggle は `role="radiogroup"` + `aria-checked`
- 機能リストは `<ul>` セマンティクス
- 月額の数字は `aria-label="$59 per month"` で読み上げ最適化

---

## 13. 模倣実装する際の留意点

- **2軸モデル (取引手数料 + SaaS)** の明示が重要。Free でも使えるが、規模が大きくなったら Plus が得という設計が定説。
- **Stripe Checkout + Customer Portal** で SaaS 課金は実装が軽い。
- **段階的アドオン**: 送信枠を段階化することで、コミュニティ拡大期のホストに「もう少し」を売れる。
- **Add-on の購入導線**: 管理画面の "Blasts" タブにて upsell として表示するのが定石。
- **税対応 (Tax Collection)** は Stripe Tax を利用すれば実装軽い。日本の消費税にも対応 (はず)。
- **Hardware Scanners**: BLE / WebHID の連携が必要だが、Enterprise 向けに限定すれば実装の優先度は下げられる。
- **Free の十分な機能**: 「Unlimited Event + Unlimited Guest + 500 通メール」と提示することで Free でも十分な価値があると訴求し、信頼を獲得 → Plus への自然な転換を狙う。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **明確な3プラン構造**: Free / Plus / Enterprise が明示。connpass の「個人/法人」「無料/プレミアム」の区分は曖昧。
- **トランザクション収益のスケーラビリティ**: 売上が大きいホストほど 5% → 0% (Plus) の差が大きく、ホストに Plus 化のインセンティブが働く。
- **段階的アドオン**: 配信枠を細かく売れる。
- **Stripe Tax / Tax Collection**: 法人にとって会計処理が楽。
- **Enterprise SSO + Salesforce**: 大企業ターゲットの機能が充実。
- **API + Zapier**: 自動化ニーズに対応。connpass は API が貧弱。
- **Custom URL**: ブランディング向上 (例: `events.mycompany.com` → Luma の裏付け)。

### Luma が劣っている点 / connpass の方が良い点
- **日本円表示**: Pricing が USD ($59) 表示。日本のホストには心理障壁。connpass は円表示。
- **法人請求書発行**: connpass の法人プランは請求書/年度切替に対応。Luma はカード払い前提 (推測)。Enterprise なら可能だがハードル高い。
- **無料プランで広告除去**: connpass は無料でも基本広告ない。Luma も Free で広告は無いが、ブランディング表示はあり (推測)。
- **大学・非営利向けの割引**: Luma の "Luma for Non-Profits" ヘルプはあるが、プログラムは曖昧。connpass は非営利・大学・自治体に手厚いケースが多い。
- **支払い方法の幅**: Konbini, iDEAL など対応はあるが、日本のホスト側決済 (支払元としての銀行振込) には弱い。connpass はそこを補完するエコシステムがある。
- **公開イベントの送客力**: connpass のコミュニティ規模を背景にしたオーガニック集客が強い。Luma は購読者数勝負で日本ではまだ弱い。
