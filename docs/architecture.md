# tech-event アーキテクチャ

最終更新: 2026-06-05 / Next.js 16.2.7 + React 19.2.4 + Prisma 7.8 (SQLite default / PostgreSQL optional)

本ドキュメントは tech-event 全体の構造を、レイヤー / 依存関係 / データフロー /
認証フローの 4 視点から俯瞰する。詳細仕様は `research/` (一次調査) と
`docs/design-system.md` / `docs/perf-report.md` / `docs/completion-report.md` を参照。

---

## 1. レイヤーアーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│  Presentation                                                    │
│   src/app/**/page.tsx           (Server Components / 41 ページ)  │
│   src/app/**/route.ts           (Route Handlers / 23 endpoint)   │
│   src/components/**/*.tsx       (UI primitives + composites)     │
│   src/components/ui/**          (shadcn ベース 21 個)            │
│   .storybook/, src/stories/**   (デザインシステム MDX + Stories) │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ "use server" / fetch
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Application                                                     │
│   src/app/actions/**            (Server Actions × 9)             │
│     calendar / comment / event / event-admin / group /           │
│     lottery / notification / survey / checkin                    │
│   src/lib/auth.ts               (session cookie + bcrypt)        │
│   src/lib/serialize.ts          (BigInt → JSON safe)             │
│   src/lib/notification.ts       (in-app 通知発火)                 │
│   src/lib/ical.ts               (RFC 5545 生成)                  │
│   src/lib/public-api.ts         (X-API-Key 検証 + rate limit)    │
│   src/lib/seo.ts                (metadata / JSON-LD)             │
│   src/middleware.ts             (x-pathname ヘッダ付与)          │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ PrismaClient (driver adapter)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Data Access                                                     │
│   src/lib/prisma.ts             (シングルトン PrismaClient)       │
│   src/generated/prisma/         (生成された Client / SQLite)      │
│   src/generated/prisma-pg/      (生成された Client / PG, optional)│
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ better-sqlite3 / pg
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Persistence                                                     │
│   dev.db (SQLite, default)                                       │
│   PostgreSQL 16 (optional, docker-compose で起動)                 │
│   28 model / 約 1,473 件のシードレコード                          │
└──────────────────────────────────────────────────────────────────┘
```

各層は **片方向**: Presentation → Application → Data Access → Persistence。
反対向きの参照 (Persistence が Component を import するような構造) は禁止。

---

## 2. 主要依存関係

### 2.1 ランタイム

| 区分 | パッケージ | バージョン | 役割 |
| --- | --- | --- | --- |
| フレームワーク | `next` | 16.2.7 | App Router + Turbopack |
| UI | `react`, `react-dom` | 19.2.4 | Server Components 主体 |
| スタイリング | `tailwindcss` | 4.x | utility-first + CSS variables |
| プリミティブ | `@radix-ui/react-*` | 1.x / 2.x | a11y 担保の headless UI |
| アイコン | `lucide-react` | 1.17 | 50 種選定 (`docs/icons.md`) |
| バリデーション | `zod` | 4.4.3 | Server Action 入力検証 |
| Markdown | `marked` | 18.0.4 | コメント / 説明文レンダリング |
| QR | `qrcode-svg` | 1.1.0 | ShareModal QR コード |
| Notification | `sonner` | 2.0.7 | トースト通知 |
| Form | `react-hook-form` + `@hookform/resolvers` | 7.77 / 5.4 | フォーム制御 |
| Auth | `next-auth` (一部) + 自前 session cookie | 5.0.0-beta.31 | bcryptjs ハッシュ |
| Mail | `nodemailer` | 8.0.10 | Magic Link / 通知送信 (本番) |
| Storage | `@aws-sdk/client-s3` | 3.x | S3 互換ストレージ (本番) |
| DB | `@prisma/client` + `@prisma/adapter-better-sqlite3` | 7.8 | driver adapter |

### 2.2 開発時のみ

| 区分 | パッケージ | 役割 |
| --- | --- | --- |
| E2E | `@playwright/test` + `@axe-core/playwright` | 33 spec / 181 test() |
| Unit | `vitest` + `@vitest/browser-playwright` | コンポーネント単体 |
| Storybook | `storybook` v10 + `@storybook/nextjs-vite` + `@storybook/addon-a11y` | 35 stories + 12 MDX |
| Linter | `eslint` v9 + `eslint-config-next` | + `eslint-plugin-storybook` |
| Schema 生成 | `prisma` | migrate / generate / studio |

### 2.3 依存方向の原則

```
research/ (静的調査)
        │
        ▼
prisma/schema.prisma         ← 正本 (SQLite)
        │
        │ (sync-schema-pg.ts で生成)
        ▼
prisma/schema.postgres.prisma ← 自動生成 (PostgreSQL)
        │
        ▼
src/generated/prisma{,-pg}/   ← Prisma Client 生成物
        │
        ▼
src/lib/prisma.ts             ← シングルトン
        │
        ▼
src/app/**/page.tsx, src/app/actions/**, src/app/api/**/route.ts
        │
        ▼
src/components/**             ← UI 層
```

UI 層は **Prisma を直接 import しない**。Server Component が Prisma を呼び、
Server Action が Prisma を経由してミューテーションする。

---

## 3. データフロー

### 3.1 Read (Server Component)

```
URL リクエスト
   │
   ▼
src/middleware.ts (x-pathname ヘッダ付与)
   │
   ▼
src/app/event/[id]/page.tsx (Server Component, async)
   │
   ├─ prisma.event.findUnique({ where, include: { roles, participants, comments } })
   │   └─ better-sqlite3 / pg adapter → dev.db / PostgreSQL
   │
   ├─ serializeBigInt() で JSON 化 (Prisma BigInt → string)
   │
   ▼
JSX (Server Component) → HTML
   │
   ▼
Hydration: src/components/event/EventDetail.tsx
            "use client" の部分のみ Client Component に置換
```

### 3.2 Write (Server Action)

```
ユーザー: フォーム submit ("use client")
   │
   ▼
"use server" な関数 (src/app/actions/event.ts: createEventAction 等)
   │
   ├─ getCurrentUser() で session 確認 (te_session cookie → DB lookup)
   │
   ├─ zod スキーマ (eventCreateSchema.parse(input))
   │
   ├─ prisma.event.create({ data, include })
   │
   ├─ revalidatePath("/group/[subdomain]")
   │
   ▼
redirect("/event/" + newId)  ← Next.js が 303 を返却
```

### 3.3 Public API (REST)

```
GET /api/v2/events?keyword=React&order=2
   │
   ▼
src/app/api/v2/events/route.ts (Route Handler)
   │
   ├─ validatePublicApiRequest() (src/lib/public-api.ts)
   │    - X-API-Key 検証
   │    - User-Agent 必須
   │    - in-memory rate limit (1 req/sec)
   │
   ├─ prisma.event.findMany({ where, orderBy, take })
   │
   ├─ serializeForApi() (BigInt → string, Date → ISO)
   │
   ▼
NextResponse.json({ results_returned, events: [...] })
```

---

## 4. 認証フロー

### 4.1 メール+パスワード

```
POST /api/auth/login { email, password }
   │
   ▼
1. prisma.user.findUnique({ where: { email } })
2. bcrypt.compare(password, user.passwordHash)
3. ランダム sessionId 生成 (crypto.randomUUID)
4. DB に session ストア (現状 in-memory + cookie)
5. cookie set: te_session=<id>; HttpOnly; SameSite=Lax
   │
   ▼
redirect("/dashboard")
```

### 4.2 Magic Link (Luma 由来)

```
POST /api/auth/magic-link/request { email }
   │
   ▼
1. MagicLinkToken を DB に作成 (uuid + expiresAt 15min)
2. nodemailer or console.log で URL を送信
   ※ 開発時は console、本番は SMTP_URL (Mailpit / SES 等)
   │
   ▼
ユーザー: メール内リンク (?token=xxx) をクリック
   │
   ▼
GET /api/auth/magic-link/verify?token=xxx
   │
   ├─ DB から token 検索、expiresAt / usedAt チェック
   ├─ usedAt = now() に更新
   ├─ user upsert (初回はサインアップ扱い)
   └─ te_session cookie 発行
   │
   ▼
redirect("/dashboard")
```

### 4.3 dev-login (開発時)

```
GET /api/auth/dev-login?nickname=fast_moon_169&next=/dashboard
   │
   ▼
1. NODE_ENV !== "production" 限定
2. prisma.user.findUnique({ where: { nickname } })
3. te_session cookie 即発行
   │
   ▼
redirect(next)
```

E2E テスト (33 spec / 181 test) はすべてこの経路でログインしている。

---

## 5. テスト戦略

| レイヤー | ツール | 場所 | 件数 |
| --- | --- | --- | --: |
| Unit | Vitest | (将来導入予定) | 0 |
| Component visual | Storybook + addon-a11y + addon-vitest | `src/stories/` + `*.stories.tsx` | 35 stories |
| E2E (機能) | Playwright | `e2e/*.spec.ts` | 181 test |
| E2E (a11y) | Playwright + @axe-core | `e2e/a11y-pages.spec.ts`, `components-a11y.spec.ts` | 10+ pages |
| E2E (visual) | Playwright `toHaveScreenshot` | `e2e/visual-compare*.spec.ts` | 9+ ペア |
| E2E (perf) | Playwright + chrome devtools | `e2e/perf.spec.ts` | 10 page latency |

### 5.1 テスト隔離 (DB スナップショット方式)

```
playwright.config.ts
   ├─ globalSetup: e2e/global-setup.ts
   │   └─ dev.db を dev.db.baseline にコピー
   ▼
全テスト実行 (workers 並列, fullyParallel=true)
   │
   ├─ create-flow.spec.ts が dev.db に書き込み (test_user で実施)
   ├─ visual-compare-dark.spec.ts が /user/fast_moon_169 を撮影
   │   → 書き込みユーザーとは別なので干渉なし
   │
   ▼
   └─ globalTeardown: e2e/global-teardown.ts
       └─ dev.db を baseline で上書き、baseline を削除
```

これにより:

- 同一テスト run 内: write テストが visual テストを汚染しない (異なるユーザー)
- run 間: dev.db が常にシード直後の状態に復元される
- ローカルで何度連続実行しても DB が膨らまない

---

## 6. 拡張ポイント

### 6.1 SQLite → PostgreSQL 移行

1. `pnpm db:sync-pg` で `prisma/schema.postgres.prisma` 生成
2. `docker compose up postgres -d`
3. `DATABASE_URL="postgresql://techevent:techevent@localhost:5432/techevent" pnpm db:migrate:pg`
4. `src/lib/prisma.ts` で adapter を `PrismaPg` に切替 (TODO)
5. `pnpm seed` のロジックを PG 互換 generated client から import するよう調整

### 6.2 SMTP / S3 連携

- `docker-compose.yml` の Mailpit (`smtp://localhost:1025`) を `SMTP_URL` に設定
- `nodemailer` の transport を `src/lib/mail.ts` (将来) で初期化
- MinIO は `S3_ENDPOINT=http://localhost:9000` で `@aws-sdk/client-s3` から接続
- カバー画像アップロード API を `/api/upload` (将来) として実装

### 6.3 next-auth (OAuth) 配線

- `oauth_identities` テーブルは schema 既設
- `@auth/prisma-adapter` で next-auth に紐付け
- `next-auth.config.ts` に Twitter / GitHub provider 追加

---

## 7. 参考リンク

- [docs/design-system.md](design-system.md) — トークン / コンポーネント仕様
- [docs/completion-report.md](completion-report.md) — 完成度マトリクス
- [docs/perf-report.md](perf-report.md) — bundle / latency 計測
- [docs/icons.md](icons.md) — アイコン規約
- [docs/component-classification.md](component-classification.md) — コンポーネント分類 (shadcn/ui スタイル: ui / components / blocks / foundations)
- [docs/motion.md](motion.md) — モーション規約
- [docs/design-system-audit.md](design-system-audit.md) — DS 最終監査
- [research/README.md](../research/README.md) — connpass 調査資料
- [research/luma/README.md](../research/luma/README.md) — Luma 調査資料
- [CHANGELOG.md](../CHANGELOG.md) — 主要マイルストーン履歴
