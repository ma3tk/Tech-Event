# tech-event デプロイメントガイド

本ドキュメントは tech-event を本番環境で運用するためのデプロイ手順をまとめたものです。

対応ターゲット:

1. **Vercel** (推奨。Next.js / Edge / cron 等が一体運用しやすい)
2. **Docker + 任意ホスト** (Fly.io / Render / Railway / 自前 VPS / k8s)
3. **PostgreSQL 移行** (SQLite → PG)

---

## 1. 前提

| 項目 | 推奨 | 最低限 |
| --- | --- | --- |
| Node.js | 22 LTS | 20.x |
| pnpm | 11+ | 9+ |
| データベース | PostgreSQL 16+ | SQLite 3.40+ |
| メモリ | 512 MB+ | 256 MB |
| 同時接続 | 1k req/min | 100 req/min |

---

## 2. Vercel デプロイ手順

### 2.1 初期セットアップ

1. リポジトリを GitHub に push する。
2. Vercel ダッシュボードで `Import Project` から接続。
3. Framework は **Next.js** を自動検出。Build Command は `vercel.json` で `prisma migrate deploy && next build` に上書き済み。
4. Region は `nrt1` (Tokyo) を指定 (`vercel.json` で固定済み)。

### 2.2 環境変数 (必須)

Vercel ダッシュボード → Project → Settings → Environment Variables で以下を設定:

| 変数 | 値の例 | スコープ |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db?sslmode=require` | Production |
| `AUTH_SECRET` | `openssl rand -base64 32` の出力 | Production / Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.com` | Production |
| `CRON_SECRET` | 32 文字以上のランダム文字列 | Production |
| `PUBLIC_API_KEY` | 公開 API キー (clients に配布する値) | Production |

### 2.3 オプション env (機能を有効化したい場合のみ)

| 機能 | 必要な env |
| --- | --- |
| Stripe Checkout | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Plus プラン課金 (subscription, 2026-07-06 追加) | 上記 Stripe 3 変数 + `STRIPE_PLUS_PRICE_ID` (Plus プランの Price ID)。未設定なら billing UI は「準備中」 |
| Web Push (2026-07-06 追加) | `pnpm add web-push` + `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`。鍵は `npx web-push generate-vapid-keys` で生成。未設定なら no-op |
| Magic Link / 通知メール | `SMTP_URL`, `SMTP_FROM` (Resend 利用なら `MAIL_PROVIDER=resend`, `RESEND_API_KEY`) |
| OAuth (X) | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |
| OAuth (GitHub) | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| OAuth (Facebook) | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| S3 / R2 画像保存 | `STORAGE_PROVIDER=s3`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT` |
| Sentry 監視 | `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |

### 2.4 PostgreSQL の用意

Vercel では DB を提供していないので、外部 PG を用意する。

推奨プロバイダ:

- **Neon** (https://neon.tech) — serverless PG。connection pooling 内蔵。
- **Supabase** (https://supabase.com) — PG + Auth + Storage 一体。
- **Railway** (https://railway.app) — PG + Redis + S3 など。

`DATABASE_URL` には PgBouncer / 接続プール URL を推奨 (`?pgbouncer=true&connection_limit=1` 等)。

### 2.5 初回 migration

`vercel.json` の `buildCommand` で自動実行されるため特別な操作は不要:

```
prisma migrate deploy && next build
```

シードを流したい場合 (本番には通常推奨しない):

```bash
DATABASE_URL=postgres://... pnpm tsx prisma/seed.ts
```

### 2.6 Cron 設定

`vercel.json` の `crons` で自動登録される (毎時 0 分):

```json
{ "path": "/api/cron/run-lotteries?secret=$CRON_SECRET", "schedule": "0 * * * *" }
```

Vercel は `$CRON_SECRET` を Environment Variables から解決する。

リマインダー通知 (24h / 1h 前、2026-07-06 追加) を使う場合は `crons` に以下も追加する
(`vercel.json` には未登録なので運用時に追記):

```json
{ "path": "/api/cron/run-reminders?secret=$CRON_SECRET", "schedule": "*/15 * * * *" }
```

### 2.7 Stripe Webhook 設定

1. https://dashboard.stripe.com/webhooks で新規エンドポイントを作成。
2. URL: `https://your-domain.com/api/payments/webhook`
3. Listen to events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
4. 表示される `Signing secret` (`whsec_...`) を `STRIPE_WEBHOOK_SECRET` として env に登録。

### 2.8 動作確認

```bash
curl https://your-domain.com/api/health
# → {"ok":true,"version":"0.1.0","uptime":..,"db":"ok",...}

curl https://your-domain.com/api/ready
# → {"ready":true,...}
```

---

## 3. Docker デプロイ手順

### 3.1 build

```bash
docker build -t tech-event:latest .
```

multi-stage build で `node:22-bookworm-slim` ベースの最小ランタイム image (~300MB) ができる。

### 3.2 環境変数ファイル

`.env.production` を作成 (Vercel と同じ env を記述):

```ini
DATABASE_URL=postgres://user:pass@db.host:5432/techevent?sslmode=require
AUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_BASE_URL=https://your-domain.com
CRON_SECRET=...
PUBLIC_API_KEY=...
```

### 3.3 起動

```bash
docker run -d \
  --name tech-event \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  tech-event:latest
```

### 3.4 PostgreSQL も一緒に立てる (docker-compose)

リポジトリ同梱の `docker-compose.yml` で `postgres`, `mailpit`, `minio` をローカル起動できる:

```bash
docker compose up -d postgres mailpit minio
# その後、上の docker run でアプリ本体を起動
# (アプリも同じネットワークに入れたい場合は services に追加する)
```

### 3.5 cron (Docker 環境)

Docker は cron 機能を持たないので、別途以下のいずれかで叩く:

1. **ホスト OS の crontab**:

   ```cron
   0 * * * * curl -fsS "https://your-domain.com/api/cron/run-lotteries?secret=$CRON_SECRET" > /dev/null
   */15 * * * * curl -fsS "https://your-domain.com/api/cron/run-reminders?secret=$CRON_SECRET" > /dev/null
   ```

2. **k8s CronJob**:

   ```yaml
   apiVersion: batch/v1
   kind: CronJob
   metadata:
     name: tech-event-lottery
   spec:
     schedule: "0 * * * *"
     jobTemplate:
       spec:
         template:
           spec:
             containers:
               - name: curl
                 image: curlimages/curl:latest
                 args:
                   - curl
                   - -fsS
                   - "https://your-domain.com/api/cron/run-lotteries?secret=$(CRON_SECRET)"
   ```

### 3.6 ヘルスチェック

Dockerfile に `HEALTHCHECK` を組み込み済み:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

`docker ps` の `STATUS` 列で `healthy` / `unhealthy` が確認できる。

---

## 4. PostgreSQL 移行手順 (SQLite → PG)

開発時は SQLite (`file:./dev.db`)、本番は PostgreSQL を推奨。

### 4.1 PG スキーマの生成

```bash
pnpm db:sync-pg
# → prisma/schema.postgres.prisma が SQLite 正本から再生成される
```

### 4.2 環境変数を切替

```bash
export DATABASE_URL="postgres://user:pass@host:5432/techevent?sslmode=require"
```

### 4.3 migration を流す

```bash
pnpm db:migrate:pg
```

`src/lib/prisma.ts` の adapter は `DATABASE_URL` の接頭で SQLite / PG を自動切替するため、コード変更は不要。

### 4.4 既存 SQLite データの移行 (option)

データを残したい場合は `pgloader` を推奨:

```bash
pgloader sqlite://./dev.db postgresql://user:pass@host:5432/techevent
```

カラム型は Prisma 7 + driver adapter 経由でほぼ互換 (BigInt / DateTime 注意)。

---

## 5. SMTP プロバイダの選び方

| プロバイダ | 設定 | 用途 |
| --- | --- | --- |
| Resend | `MAIL_PROVIDER=resend`, `RESEND_API_KEY=re_...` | DX 重視 / 月 3000 通まで無料 |
| SendGrid | `MAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY=SG.\*` | 大量配信 / 詳細な配信分析が必要 |
| AWS SES | `SMTP_URL=smtp://AKIA...:secret@email-smtp.us-east-1.amazonaws.com:587` | AWS 既存 / 安価 |
| Mailgun | `SMTP_URL=smtp://postmaster@...:pwd@smtp.mailgun.org:587` | 開発ログ + 本番両対応 |
| Mailpit (dev) | `SMTP_URL=smtp://localhost:1025` | ローカル開発 (`docker compose up mailpit`) |

`SMTP_FROM` は `"tech-event <noreply@your-domain.com>"` 形式を推奨。送信ドメインの SPF / DKIM / DMARC 設定を忘れずに。

---

## 6. 環境変数完全リスト

下記は `src/env.ts` の Zod スキーマと完全に対応する。

### 6.1 Core (production 必須)

| 名前 | 説明 |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` (SQLite) or `postgres://...` (PG)。production では required。 |
| `AUTH_SECRET` | next-auth + te_session HMAC 署名。`openssl rand -base64 32` で生成。production 必須。 |
| `NEXT_PUBLIC_BASE_URL` | 絶対 URL ベース (canonical / OG / sitemap)。production 必須。 |

### 6.2 Core (optional)

| 名前 | 説明 |
| --- | --- |
| `CRON_SECRET` | `/api/cron/run-lotteries?secret=xxx` と `/api/cron/run-reminders?secret=xxx` (リマインダー 24h/1h、2026-07-06 追加) の共通認証。未設定なら cron は 503。 |
| `PUBLIC_API_KEY` | `/api/v2/*` の `X-API-Key` 認証。未設定なら 401。 |

### 6.3 Feature flags

| 名前 | 値 | 説明 |
| --- | --- | --- |
| `ENABLE_DEV_LOGIN` | `0` / `1` | 開発用ログイン (`/api/auth/dev-login`) を有効化。production では強制 disable。 |
| `ENABLE_TEST_ENDPOINTS` | `0` / `1` | E2E 用 test endpoint を有効化。production では強制 disable。 |
| `SLACK_WEBHOOK_ALLOW_TEST_HOSTS` | `0` / `1` | Slack Webhook の localhost 許可。E2E のみ。 |
| `LEGACY_SESSION_FALLBACK` | `0` / `1` | 旧形式 te_session cookie を受け入れる。移行期だけ 1。 |
| `MAGIC_LINK_LEGACY_GET` | `0` / `1` | Magic Link 旧 GET 挙動。本番では未設定推奨。 |

### 6.4 SMTP / Mailer

| 名前 | 説明 |
| --- | --- |
| `MAIL_PROVIDER` | `smtp` / `resend` / `sendgrid` / `console` |
| `SMTP_URL` | `smtp://user:pass@host:port` (provider=smtp 時) |
| `SMTP_FROM` | `tech-event <noreply@example.com>` 形式の From |
| `RESEND_API_KEY` | provider=resend 時 |
| `SENDGRID_API_KEY` | provider=sendgrid 時 |
| `E2E_MAIL_CAPTURE` | `1` で送信内容をメモリにキャプチャ (テスト用) |

### 6.5 Storage / S3

| 名前 | 説明 |
| --- | --- |
| `STORAGE_PROVIDER` | `local` (default) / `s3` |
| `S3_BUCKET` / `S3_REGION` | バケット名と region |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | アクセスキー |
| `S3_ENDPOINT` | MinIO / R2 / 自前 S3 互換 endpoint (空なら AWS) |

### 6.6 OAuth

| 名前 | 説明 |
| --- | --- |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | X (Twitter) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook |

各プロバイダの callback URL は `https://your-domain.com/api/auth/callback/{provider}` を登録する (`/api/auth/callback/twitter` 等)。

### 6.7 Stripe

| 名前 | 説明 |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | webhook 検証 (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client 用公開可能キー |
| `STRIPE_PLUS_PRICE_ID` | Plus プラン (グループ向け subscription) の Price ID。`STRIPE_SECRET_KEY` と両方設定で `/group/[subdomain]/admin/billing` の課金が有効化 (2026-07-06 追加) |

#### Stripe webhook secret の作り方

1. Stripe ダッシュボード → Developers → Webhooks → `Add endpoint`
2. URL に `https://your-domain.com/api/payments/webhook` を入れる
3. Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
4. 作成後、表示される `Signing secret` (`whsec_...`) を `STRIPE_WEBHOOK_SECRET` に設定

### 6.7.5 Web Push (VAPID, 2026-07-06 追加)

| 名前 | 説明 |
| --- | --- |
| `VAPID_PUBLIC_KEY` | VAPID 公開鍵 (`npx web-push generate-vapid-keys` で生成) |
| `VAPID_PRIVATE_KEY` | VAPID 秘密鍵 (ログ出力禁止) |
| `VAPID_SUBJECT` | `mailto:` or https URL (未設定時は `mailto:noreply@tech-event.local`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `VAPID_PUBLIC_KEY` と同値 (client 側の購読登録に使用) |

`web-push` パッケージは dynamic import。`pnpm add web-push` + 上記 env が揃うと実配信が有効化され、
未設定なら no-op スキャフォールドとして安全に動作する。

### 6.8 Observability (Sentry / Logging)

| 名前 | 説明 |
| --- | --- |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | source map upload 用 |
| `SENTRY_ENVIRONMENT` | `production` / `staging` 等 |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` 等の sample rate |
| `SENTRY_ENABLE_DEV` | dev でも有効化したい場合 `1` |
| `SENTRY_DISABLE_WRAP` | webpack plugin を無効化 `1` |
| `LOG_LEVEL` | pino の log level (`info` / `debug` / `warn` / ...) |
| `METRICS_TOKEN` | `/api/metrics` 系の認証 (任意) |

---

## 7. トラブルシューティング

### 7.1 起動時に `AUTH_SECRET must be set in production` で死ぬ

→ env に `AUTH_SECRET` を設定する。`openssl rand -base64 32` で生成可能。

### 7.2 health endpoint が `db: "error"` を返す

→ `DATABASE_URL` の接続情報を確認。PG なら `sslmode=require` が必要なケースが多い。Neon / Supabase は connection pooler URL を使う。

### 7.3 Cron が動かない

→ Vercel: ダッシュボードの Cron Jobs タブで実行履歴を確認。CRON_SECRET 未設定なら 503 で fail。
→ Docker: ホスト側の crontab / k8s CronJob で叩く設定が必要。

### 7.4 画像最適化が 400 / 404 を返す

→ `next.config.ts` の `images.remotePatterns` に対象ホストを追加する。R2 / B2 / CloudFront 等は既に `**.r2.cloudflarestorage.com` / `**.backblazeb2.com` / `**.cloudfront.net` で許可済み。

### 7.5 SQLite モードに戻したい

→ `DATABASE_URL="file:./dev.db"` に変更するだけ。`src/lib/prisma.ts` は接頭で自動判定する。

---

## 8. 参考

- Next.js standalone output: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Prisma Driver Adapters: https://www.prisma.io/docs/orm/overview/databases/database-drivers
- Vercel Cron: https://vercel.com/docs/cron-jobs
- `@t3-oss/env-nextjs`: https://env.t3.gg/
