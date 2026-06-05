# Luma Webhooks

## 概要

Luma の Webhook はイベント駆動の外部統合を実現するためのプッシュ通知メカニズム。Slack 通知、Notion DB 同期、CRM 自動化、Zapier 経由ノーコード連携などに使える。**Plus プラン以上**で利用可能。エンドポイントは `/v1` と `/v2` が混在する per-route versioning。

## 利用可能な Webhook イベント

公式 docs の llms.txt 索引から確認できる対応イベント:

| Event Type | 発火タイミング |
| --- | --- |
| `*` | すべてのイベント (catch-all) |
| `event.created` | カレンダー内に新規イベントが作成された時 |
| `event.updated` | イベントの内容が更新された時 |
| `event.canceled` | イベントがキャンセルされた時 |
| `guest.registered` | ゲストが登録した時 (再登録含む) |
| `guest.updated` | ゲスト状態が変わった時 (approve/decline/check-in 等) |
| `ticket.registered` | 有料/無料いずれかのチケットが発行された時 |
| `calendar.event.added` | カレンダーにイベントが追加された時 (cross-host 含む) |
| `calendar.person.subscribed` | 新規にカレンダーを購読した人 |

## Webhook 登録 (Create)

```bash
curl -X POST https://public-api.luma.com/v2/webhooks/create \
  -H "x-luma-api-key: $LUMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.mycompany.com/luma-webhook",
    "event_types": ["guest.registered", "guest.updated", "event.created"]
  }'
```

レスポンス:
```json
{
  "id": "wbh-abc123",
  "secret": "whsec_xxxxxxxxxxxxx",
  "url": "https://api.mycompany.com/luma-webhook",
  "event_types": ["guest.registered", "guest.updated", "event.created"],
  "status": "active",
  "created_at": "2025-06-04T12:00:00Z"
}
```

`secret` は **Webhook 受信時の署名検証**に使う共有秘密。次回以降取得不可なので保存必須。

## 配信フォーマット (推定)

Luma Webhook の HTTP リクエスト:

```http
POST /luma-webhook HTTP/1.1
Host: api.mycompany.com
Content-Type: application/json
X-Luma-Webhook-Id: wbh-abc123
X-Luma-Event-Type: guest.registered
X-Luma-Signature: t=1717500000,v1=abc123def456...
X-Luma-Delivery-Id: del-xyz789

{
  "event_type": "guest.registered",
  "created_at": "2025-06-04T12:00:00Z",
  "data": {
    "event": { ... },
    "guest": { ... }
  }
}
```

## 署名検証 (推奨)

Stripe 系の HMAC-SHA256 署名と類似想定:

```ts
import crypto from 'crypto';

function verifyLumaSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const expected = crypto.createHmac('sha256', secret)
    .update(`${parts.t}.${payload}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
```

(注: Luma の正確な署名スキームは公式 docs に詳細記載があるはず。実装時は最新仕様確認推奨)

## ペイロード例

### `event.created`

```json
{
  "event_type": "event.created",
  "data": {
    "event": {
      "id": "evt-abc",
      "name": "Tokyo AI Tinkerers #12",
      "start_at": "2025-07-15T19:00:00Z",
      "end_at": "2025-07-15T21:00:00Z",
      "timezone": "Asia/Tokyo",
      "url": "https://luma.com/tokyo-ai-tinkerers-12",
      "cover_url": "...",
      "visibility": "public",
      "hosts": [...]
    }
  }
}
```

### `guest.registered`

```json
{
  "event_type": "guest.registered",
  "data": {
    "event": { "id": "evt-abc", "name": "Tokyo AI Tinkerers #12" },
    "guest": {
      "api_id": "gst-xyz",
      "user_email": "alice@example.com",
      "user_name": "Alice Smith",
      "approval_status": "approved",
      "registered_at": "2025-06-04T12:00:00Z",
      "event_tickets": [...]
    }
  }
}
```

### `ticket.registered`

```json
{
  "event_type": "ticket.registered",
  "data": {
    "event": { "id": "evt-abc" },
    "guest": { "api_id": "gst-xyz" },
    "ticket": {
      "api_id": "tkt-...",
      "ticket_type_id": "evt-tkt-...",
      "amount": 2500,
      "currency": "JPY",
      "checked_in_at": null
    }
  }
}
```

## Webhook 管理 API

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/webhooks/list` | 登録済み一覧 |
| GET | `/v2/webhooks/get` | 個別取得 |
| POST | `/v2/webhooks/create` | 新規作成 |
| POST | `/v2/webhooks/update` | URL / event_types / status 更新 |
| POST | `/v1/webhooks/delete` | 削除 |

## ステータス管理

- `active` — 正常配信
- `paused` — 一時停止 (連続失敗時に自動 pause される可能性あり)
- 失敗時のリトライ: 指数バックオフで複数回想定 (公式詳細は要確認)

## ベストプラクティス

1. **冪等性**: `X-Luma-Delivery-Id` をキーに重複排除する
2. **3 秒以内に 200 を返す**: 重い処理は queue に逃がす
3. **署名検証** を必ず行う (なりすまし防止)
4. **HTTPS 必須** (HTTP は受け付けない想定)
5. **Webhook URL は環境ごとに分ける** (stg / prod)
6. **失敗ログ**: Luma 側のダッシュボードで配信履歴を確認

## ユースケース

### Slack 通知 (新規登録)

```ts
app.post('/luma-webhook', async (req, res) => {
  if (!verify(req)) return res.status(401).end();
  const { event_type, data } = req.body;
  if (event_type === 'guest.registered') {
    await slack.send({
      text: `🎉 ${data.guest.user_name} just registered for ${data.event.name}!`
    });
  }
  res.status(200).end();
});
```

### Notion DB 同期

- `guest.registered` → Notion DB にゲスト追加
- `guest.updated` → Notion ステータス更新
- `event.canceled` → Notion 該当ページに "Canceled" マーク

### CRM (HubSpot) 連携

- `guest.registered` → HubSpot Contact 作成 / 更新
- `ticket.registered` → Deal 作成 (有料イベント)

## connpass との比較

connpass には Webhook がない。RSS / iCal / 公開 API の polling で代用するしかない。Luma は本格的な Webhook を提供している唯一のテック系コミュニティイベントプラットフォーム。

## 真似すべきポイント

1. **Webhook イベントを 7〜9 種類に絞る** — 多すぎず必要十分
2. **`*` catch-all** を提供してデバッグしやすく
3. **secret は作成時にだけ返す** (Stripe / GitHub と同様)
4. **配信履歴ダッシュボード** で debug を支援
5. **per-route versioning** で v1 → v2 移行を強制せず段階的に
