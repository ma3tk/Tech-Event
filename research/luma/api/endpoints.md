# Luma Public API: 主要エンドポイント

## 構成

`https://public-api.luma.com` + `/v{n}/{resource}/{action}` 形式。
すべて `x-luma-api-key` ヘッダー必須。

## 1. User

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/user/get-self` | API キーに紐づく自分のユーザー情報 |

## 2. Entity Lookup (汎用)

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/entity/lookup?slug={slug}` | slug から user / calendar / org 解決 |

## 3. Calendars

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/calendars/get` | カレンダー詳細取得 |
| GET | `/v1/calendar/admins/list` | カレンダー admin 一覧 |
| GET | `/v1/organizations/calendars/list` | 組織内カレンダー一覧 |
| POST | `/v2/organizations/calendars/create` | 新規カレンダー作成 |

## 4. Events (Core)

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/event/get?id=evt-xxx` | イベント詳細 |
| GET | `/v1/calendar/lookup-event` | イベント存在チェック |
| GET | `/v1/calendar/list-events` | カレンダー所属イベント一覧 |
| GET | `/v1/organizations/events/list` | 組織内全イベント |
| POST | `/v1/event/create` | 新規イベント作成 |
| POST | `/v1/event/update` | イベント更新 |
| POST | `/v1/calendar/add-event` | 既存イベントをカレンダーに追加 |
| POST | `/v1/calendar/approve-event` | 投稿イベント承認 (visible 化) |
| POST | `/v1/calendar/reject-event` | 投稿拒否 |
| POST | `/v1/event/cancel-request` | キャンセル要求 (二段階) |
| POST | `/v1/event/cancel` | 確定キャンセル (返金実行) |
| POST | `/v1/organizations/events/transfer-calendar` | 別カレンダーへ移管 |

### `POST /v1/event/create` リクエスト例

```json
{
  "name": "Tokyo AI Tinkerers #12",
  "start_at": "2025-07-15T19:00:00Z",
  "end_at": "2025-07-15T21:00:00Z",
  "timezone": "Asia/Tokyo",
  "description_md": "## What we'll cover\n- ...",
  "cover_url": "https://luma.com/cdn/...",
  "geo_address_json": { "address": "Shibuya", "city": "Tokyo", "country": "JP" },
  "meeting_url": null,
  "max_capacity": 100,
  "visibility": "public",
  "slug": "tokyo-ai-tinkerers-12",
  "tint_color": "#5C66FF",
  "registration_questions": [
    { "type": "text", "label": "Your company", "required": false }
  ]
}
```

レスポンス:
```json
{ "id": "evt-abc123", "api_id": "evt-abc123" }
```

### `GET /v1/event/get` レスポンス例

```json
{
  "event": {
    "id": "evt-abc123",
    "name": "Tokyo AI Tinkerers #12",
    "start_at": "2025-07-15T19:00:00Z",
    "end_at": "2025-07-15T21:00:00Z",
    "timezone": "Asia/Tokyo",
    "cover_url": "https://...",
    "url": "https://luma.com/tokyo-ai-tinkerers-12",
    "description": "...",
    "description_md": "...",
    "geo_address_json": {...},
    "coordinate": { "latitude": 35.66, "longitude": 139.70 },
    "meeting_url": null,
    "visibility": "public",
    "registration_questions": [...],
    "feedback_email": { "enabled": true, "delay_minutes": 60 }
  },
  "hosts": [
    { "id": "usr-...", "email": "...", "name": "Alice", "avatar_url": "..." }
  ]
}
```

## 5. Guests

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/event/get-guests` | ゲスト一覧 (フィルタ可) |
| GET | `/v1/events/guests/get` | 個別ゲスト詳細 |
| POST | `/v1/event/add-guests` | ゲスト追加 / 招待 |
| POST | `/v1/event/update-guest-status` | 承認 / 拒否 / waitlist 操作 |
| POST | `/v1/event/send-invites` | 招待メール + SMS 送信 |

### `GET /v1/event/get-guests` クエリ

```
event_id (required, evt-xxx)
approval_status: approved | session | pending_approval | invited | declined | waitlist
sort_column: name | email | created_at | registered_at | checked_in_at
sort_direction: asc | desc | asc-nulls-first | desc-nulls-last
pagination_limit: 1-100
pagination_cursor: string
```

レスポンスの 1 ゲスト:
```json
{
  "guest": {
    "api_id": "gst-...",
    "user_email": "alice@example.com",
    "user_name": "Alice Smith",
    "user_first_name": "Alice",
    "user_last_name": "Smith",
    "approval_status": "approved",
    "registered_at": "2025-06-01T10:00:00Z",
    "invited_at": null,
    "joined_at": null,
    "phone_number": "+81-90-...",
    "event_tickets": [
      {
        "api_id": "tkt-...",
        "name": "General",
        "amount": 0,
        "currency": "JPY",
        "checked_in_at": null,
        "event_ticket_type_id": "evt-tkt-..."
      }
    ],
    "registration_answers": [
      { "label": "Your company", "answer": "Anthropic" }
    ],
    "eth_address": null,
    "solana_address": null
  }
}
```

## 6. Ticket Types

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/events/ticket-types/list` | チケットタイプ一覧 |
| GET | `/v1/events/ticket-types/get` | 個別取得 |
| POST | `/v1/events/ticket-types/create` | 新規作成 |
| POST | `/v1/events/ticket-types/update` | 更新 |
| POST | `/v1/event/ticket-types/delete` | 削除 |

## 7. Coupons / Discount Codes

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/calendar/coupons` | カレンダーの全クーポン |
| GET | `/v1/event/coupons` | イベントのクーポン |
| POST | `/v1/calendars/coupons/create` | カレンダー単位作成 |
| POST | `/v1/events/coupons/create` | イベント単位作成 |
| POST | `/v1/calendar/coupons/update` | 更新 (カレンダー) |
| POST | `/v1/event/update-coupon` | 更新 (イベント) |

## 8. Tags

### Event Tags

| Method | Path |
| --- | --- |
| GET | `/v1/calendar/event-tags/list` |
| POST | `/v1/calendar/event-tags/create` |
| POST | `/v1/calendar/event-tags/apply` |
| POST | `/v1/calendar/event-tags/unapply` |
| POST | `/v1/calendar/event-tags/update` |
| POST | `/v1/calendar/event-tags/delete` |

### Contact Tags (連絡先のセグメンテーション)

| Method | Path |
| --- | --- |
| GET | `/v1/calendars/contact-tags/list` |
| POST | `/v1/calendars/contact-tags/create` |
| POST | `/v1/calendars/contact-tags/apply` |
| POST | `/v1/calendars/contact-tags/unapply` |
| POST | `/v1/calendars/contact-tags/update` |
| POST | `/v1/calendars/contact-tags/delete` |

## 9. Contacts (連絡先 / CRM)

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/v1/calendars/contacts/list` | 連絡先一覧 |
| POST | `/v1/calendars/contacts/import` | CSV / 配列で一括 import |

## 10. Hosts

| Method | Path |
| --- | --- |
| POST | `/v1/event/hosts/create` |
| POST | `/v1/event/hosts/update` |
| POST | `/v1/event/hosts/remove` |

## 11. Memberships (有料コミュニティ)

| Method | Path |
| --- | --- |
| GET | `/v1/memberships/tiers/list` |
| POST | `/v1/memberships/members/add` |
| POST | `/v1/memberships/members/update-status` |

## 12. Organization

| Method | Path |
| --- | --- |
| GET | `/v1/organizations/admins/list` |

## 13. Images

| Method | Path | 用途 |
| --- | --- | --- |
| POST | `/v1/images/create-upload-url` | 事前署名 URL を取得して画像アップロード |

## 14. Webhooks

| Method | Path |
| --- | --- |
| GET | `/v1/webhooks/list` |
| GET | `/v2/webhooks/get` |
| POST | `/v2/webhooks/create` |
| POST | `/v2/webhooks/update` |
| POST | `/v1/webhooks/delete` |

## 命名規約のまとめ

- `get` = 単数取得 (id 指定)
- `list` = リスト取得 (ページング)
- `create` / `update` / `delete` = CRUD
- `apply` / `unapply` = タグ付与・解除
- `cancel` / `cancel-request` = キャンセル系
- `add-guests` / `update-guest-status` / `send-invites` = ゲスト操作系

action 名 URL なので RESTful 純粋主義者には違和感あるが、**読みやすさ**は高い。
