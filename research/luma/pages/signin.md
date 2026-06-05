# Luma サインイン (Sign In) ページ調査メモ

調査日: 2026-06-04
対象URL: https://lu.ma/signin (301 → https://luma.com/signin)
備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプ記事や同種プロダクトの挙動から補完したもの。

---

## 1. 概要・目的

`/signin` は Luma の **唯一の認証エントリーポイント** であり、サインインとサインアップが分離されていない (= 同じフォーム上で初回登録もログインも処理する) "Magic Link First" 設計。

特徴:

1. **メール起点のパスワードレス認証**: メール入力 → "Continue with Email" → メールでマジックリンク (またはワンタイムコード) 受信 → サイト復帰でログイン。
2. **電話番号認証も切替可能**: "Use Phone Number" で SMS OTP に切り替えられる。
3. **Google SSO と Passkey**: 業界標準のソーシャル + 生体認証。
4. **シームレスな遷移**: `?next=%2F<path>` で遷移先を保持し、ログイン後に元の場所へ戻す。

connpass の `/login/` と `/signup/` が分離しているのと対照的に、Luma は "Welcome to Luma" の文言で「サインインとサインアップを意識させない」設計。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/signin` | デフォルト (ログイン後 `/home`) |
| `https://luma.com/signin?next=%2Fcreate` | ログイン後 `/create` へ |
| `https://luma.com/signin?next=%2F{slug}` | 任意ページへの復帰 |
| `https://luma.com/signin?error=...` | (推測) エラーパラメータ |
| `https://luma.com/signin?invite={code}` | (推測) 招待コード経由 |
| `/signup` | (404 or signin にリダイレクト推測。完全に統合済み) |
| `https://luma.com/signout` | (推測) サインアウト |

`?next=` は **URL エンコード済みの相対パス** が標準。完全URLは入らない (CSRF/フィッシング対策、推測)。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Sign In]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│                      ┌──────────────────────────┐                        │
│                      │                          │                        │
│                      │   Welcome to Luma        │  ← H1                  │
│                      │                          │                        │
│                      │   Please sign in or      │                        │
│                      │   sign up below.         │                        │
│                      │                          │                        │
│                      │   Email                  │                        │
│                      │   ┌────────────────────┐ │                        │
│                      │   │ name@email.com     │ │                        │
│                      │   └────────────────────┘ │                        │
│                      │                          │                        │
│                      │   Use Phone Number ↗     │                        │
│                      │                          │                        │
│                      │ ┌──────────────────────┐ │                        │
│                      │ │ Continue with Email  │ │                        │
│                      │ └──────────────────────┘ │                        │
│                      │                          │                        │
│                      │   ────── or ──────       │                        │
│                      │                          │                        │
│                      │   [G] Sign in with Google│                        │
│                      │   [🔑] Sign in with Passkey│                      │
│                      │                          │                        │
│                      └──────────────────────────┘                        │
│                                                                          │
│             By continuing, you agree to our Terms & Privacy              │  (推測)
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 表示される情報項目の網羅リスト

実HTMLで観測:

- "Welcome to Luma" (H1)
- "Please sign in or sign up below." (説明)
- "Email" ラベル
- Email 入力欄 (`type=email`, placeholder 推測)
- "Use Phone Number" 切替リンク
- "Continue with Email" CTA
- "Sign in with Google" ボタン
- "Sign in with Passkey" ボタン

観測されなかったが他プロダクトの慣習および Luma ヘルプから推測される追加要素:

- Apple Sign-In (現状未対応、推測)
- Password 入力欄 (なし — Magic Link 前提)
- Forgot Password (Magic Link なので不要)
- "Continue with Phone Number" モード時の国コード選択 + 番号入力
- マジックリンク送信後の状態画面 ("Check your email for a sign-in link")
- リンク再送ボタン
- Cookie 同意バナー (推測、地域による)
- 利用規約 / Privacy Policy への小さなリンク
- Two-Factor Authentication (2FA) 入力フォーム (ヘルプ "Two Factor Authentication" あり)
- SSO 経路 (Enterprise 顧客向け "Single Sign-On (SSO)" ヘルプ)

---

## 5. UIコンポーネント

| 種別 | 用途 |
| --- | --- |
| Card (中央) | サインイン UI 全体 |
| H1 | "Welcome to Luma" |
| Input (email/tel) | 主入力欄 |
| Toggle Link | Email / Phone 切替 |
| Primary Button | "Continue with Email/Phone" |
| Divider with text | "or" |
| OAuth Button (Google) | Google ロゴ + テキスト |
| Passkey Button | WebAuthn 起点 |
| Toast / Error Banner | エラー表示 (推測) |
| Loading Spinner | 送信中 |

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 初期 | 入力欄表示 |
| バリデーションエラー | メールフォーマット不正で `aria-invalid` + メッセージ |
| 送信中 | ボタンスピナー + 無効化 |
| 送信成功 | "We sent a link to {email}" の確認画面 + Resend ボタン (推測) |
| Magic Link クリック後 | バックエンドが verify → セッション発行 → `next` パラメータの URL へリダイレクト |
| Google OAuth | popup or full-redirect。新規ユーザーは初回プロフィール設定 (推測) |
| Passkey | WebAuthn ブラウザダイアログ。登録済 Passkey で即サインイン |
| 2FA 有効 | OTP 入力フェーズへ |
| SSO ドメイン | "Continue with SSO" に動的切替 (Enterprise) (推測) |
| 既ログイン状態で `/signin` | `/home` または `next` へ自動転送 (推測) |

---

## 7. インタラクション

- メール入力 → Enter or "Continue with Email" → POST → 送信状態画面
- 受信箱で Magic Link クリック → `https://luma.com/signin/verify?token=...` (推測) → セッション確立 → `next` へ
- "Use Phone Number" → 国コード Picker + 番号入力 → SMS OTP 入力フェーズ
- Google → OAuth ポップアップ or リダイレクト → コールバック → Luma セッション化
- Passkey → `navigator.credentials.get()` 呼び出し → 公開鍵検証 → セッション
- エラー時: トースト or インライン

---

## 8. 推測されるAPIコール

- `POST /api/auth/magic-link` body: `{ email, next }` → 200 で送信成功
- `GET /api/auth/verify?token=...` → 302 リダイレクト
- `POST /api/auth/oauth/google/start` → Google OAuth エンドポイントへ
- `GET /api/auth/oauth/google/callback?code=...` → セッション発行
- `POST /api/auth/passkey/options` → WebAuthn challenge
- `POST /api/auth/passkey/verify` → assertion 検証
- `POST /api/auth/phone/otp` → SMS 送信
- `POST /api/auth/phone/verify` → コード検証
- `POST /api/auth/2fa/verify` → TOTP 検証
- `POST /api/auth/signout` → セッション破棄

セッションは httpOnly Cookie + 30日 (推測)。Active Devices 機能あり (ヘルプ "Active Devices") → デバイス管理がプロフィール設定に存在。

---

## 9. 関連リンク・遷移先

- 認証成功 → `next` パラメータの URL
- 初回ユーザー → プロフィール設定 (`/user/setup` 推測)
- Terms / Privacy リンク

---

## 10. SEOメタ情報・OGP

- `<title>`: "Sign In · Luma" (推測)
- description: 最小限
- `noindex` (推測。サインインページはインデックス対象外が定石)

---

## 11. レスポンシブ対応

- 中央寄せカードはスマホで画面幅 90% に
- ボタン縦並び
- スマホ Passkey は OS のダイアログを呼ぶ

---

## 12. A11y観点

- H1 = "Welcome to Luma"
- Input に label + autocomplete (`email`/`tel`)
- Primary ボタンは `<button type="submit">`
- エラーは `aria-live="polite"` + `aria-invalid`
- Passkey ボタンは WebAuthn 不可ブラウザで非表示 or 無効化
- フォーカスリングが視認できる

---

## 13. 模倣実装する際の留意点

- **Magic Link 起点**は UX 良いがメール到達率がボトルネック。Postmark / Resend / SendGrid を慎重に選定し、SPF/DKIM/DMARC を必ず整備。
- **`?next=` の検証**: 相対パスのみ許可、`//`, `http://`, `javascript:` 禁止。オープンリダイレクト脆弱性に注意。
- **Passkey (WebAuthn)**: 大手 IdP の Passkey 実装 (1Password / iCloud Keychain / Google Password Manager) との互換性検証必須。
- **Google OAuth**: スコープを最小限 (`openid email profile`) に。スコープ拡大時は同意画面再表示が必要。
- **2FA**: TOTP (RFC6238) + Recovery Codes が現実的。SMS 2FA はコスト高。
- **Phone OTP**: Twilio Verify など SaaS が現実的。bot 対策に reCAPTCHA / hCaptcha。
- **既ログイン時のリダイレクト**: ループ防止のため `next` を慎重に処理。
- **エラーメッセージの一貫性**: アカウントの有無を漏らさない ("Email or password incorrect" を統一)。Magic Link 方式ならアカウントの有無で UI が変わらないのが理想。
- **i18n**: ボタン文言、エラーメッセージ、送信先メールの本文。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **Magic Link / Passkey 標準採用**: パスワードレスでUX良好。connpass はパスワード方式が中心。
- **サインイン/サインアップの統合**: 認知負荷低い。connpass は別ページに分離。
- **Google SSO 1クリック**: 摩擦最小。connpass にも SNS ログインはあるが Twitter/Facebook 中心で時代遅れ感あり。
- **Passkey (WebAuthn)**: フィッシング耐性。connpass は未対応。
- **多言語ホスト**: 認証フローが英語/任意言語に切替可能 (Languages ヘルプ)。
- **`?next=` でのシームレスな復帰**: 任意ページから / signin / 任意ページの3ステップが滑らか。

### Luma が劣っている点 / connpass の方が良い点
- **日本語UI**: サインイン画面が英語のみ (推測)。日本の高齢層には不安感。
- **メール到達性**: Gmail / Yahoo の迷惑メール判定で Magic Link が届かない事故が報告されやすい。connpass のパスワード方式は到達不要。
- **Twitter/X 連携**: connpass はエンジニアが使い慣れた Twitter SSO がある。Luma は Google 一択 (推測)。
- **アカウント復旧**: connpass はパスワードリセット手順が明示的。Luma は Magic Link 経由なのでメールが届かない時の Plan B が薄い。
- **2FA の説明**: connpass のヘルプも英語化は弱いが日本語UI上で完結。Luma は Two Factor Authentication ヘルプが英語。
- **企業のメールフィルター適合**: 大企業のセキュリティポリシーで外部 Magic Link がブロックされやすい。SSO 提供 (Enterprise) は Plus 以上が必要。
- **新規登録時のプロフィール初期入力 UX**: connpass は所属/興味分野を最初に取る → 後の体験が濃い。Luma は Bio 後回し。
