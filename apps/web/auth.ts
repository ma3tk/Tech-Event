/**
 * Auth.js (next-auth v5 beta) の中央設定。
 *
 * 既存の email + password / Magic Link / dev-login ベースの
 * `te_session` Cookie 認証は完全に保持しつつ、
 * 追加で OAuth (X, Facebook, GitHub) と Credentials provider を提供する。
 *
 * NOTE:
 *   - 既存 `prisma/schema.prisma` には Auth.js 既定の `Account` / `Session` /
 *     `VerificationToken` モデルが無いため、PrismaAdapter は使わず JWT セッションで
 *     運用する。OAuth ユーザーと既存 `User` テーブルの紐づけは `signIn` callback で
 *     `OAuthIdentity` 経由で行う。
 *   - dev 環境で Client ID/Secret が未設定でも `next-auth` がエラーにならないように、
 *     未設定の Provider は空文字を渡しておき (UI 上は signIn ボタンを表示するが
 *     実際の認可コードフローは clientId が必要)、ローカル開発ではボタン表示まで動作
 *     することを担保する。
 *   - `signIn` callback で `te_session` Cookie もセットすることで、
 *     既存の `getCurrentUser()` (cookie 経由) との互換を維持する。
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Twitter from "next-auth/providers/twitter";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
// 循環依存回避: `@/lib/auth` 経由ではなく、定数・署名ヘルパーを持つ最小モジュール
// `@/lib/auth-session` から直接 import する。これにより
// `@/lib/auth` (→ `@/auth` を import) との循環依存が解消され、
// `getCurrentUser()` 内の動的 import が不要になる。
import {
  SESSION_COOKIE_NAME,
  buildSessionCookieValue,
  registerNextAuthSessionFetcher,
  type NextAuthSessionFetcher,
} from "@/lib/auth-session";
import { nextId } from "@/lib/id-gen";

/** OAuth Provider が要求する `clientId`/`clientSecret` の安全なフォールバック値。 */
function env(name: string): string {
  return process.env[name] ?? "";
}

/**
 * `User` レコードと `OAuthIdentity` を upsert する。
 *
 * - 既に `(provider, providerUid)` に紐づいた `OAuthIdentity` があればそのユーザーを使う。
 * - 無ければ email で既存ユーザーを引いてリンク。
 * - email も無ければ新規ユーザーを作成。
 *
 * @returns 紐づけた `User.id` (BigInt)
 */
async function upsertOAuthUser(params: {
  provider: "twitter" | "facebook" | "github";
  providerUid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string;
  avatarUrl?: string | null;
}): Promise<bigint | { error: "email_not_verified" }> {
  const { provider, providerUid, email, emailVerified, displayName, avatarUrl } =
    params;

  // 1. 既存の OAuthIdentity を探す
  const existing = await prisma.oAuthIdentity.findUnique({
    where: { provider_providerUid: { provider, providerUid } },
  });
  if (existing) {
    return existing.userId;
  }

  // 2. email で既存ユーザーを引く
  //    ⚠️ アカウントテイクオーバー対策: email-verified が確認できない OAuth は
  //    既存ユーザーへの自動リンクを禁止し、専用エラーを返す。
  let userId: bigint | null = null;
  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      if (!emailVerified) {
        return { error: "email_not_verified" };
      }
      userId = u.id;
    }
  }

  // 3. 新規ユーザー作成 (email が無ければ provider+uid から仮の値を作る)
  if (!userId) {
    const fallbackEmail =
      email ?? `${provider}_${providerUid}@oauth.local`;
    // nickname / id を採番 (共通ヘルパー @/lib/id-gen.nextId)
    const newUserId = await nextId(prisma, "user");
    const baseNickname = `${provider}_${providerUid}`.slice(0, 30);
    // nickname の衝突回避 (簡易)
    let nickname = baseNickname;
    let suffix = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dup = await prisma.user.findUnique({ where: { nickname } });
      if (!dup) break;
      suffix += 1;
      nickname = `${baseNickname}_${suffix}`.slice(0, 30);
    }
    const created = await prisma.user.create({
      data: {
        id: newUserId,
        nickname,
        displayName: displayName || nickname,
        email: fallbackEmail,
        avatarUrl: avatarUrl ?? null,
        status: "active",
      },
    });
    userId = created.id;
  }

  // 4. OAuthIdentity を作成 (共通ヘルパー @/lib/id-gen.nextId)
  const nextOauthId = await nextId(prisma, "oAuthIdentity");
  await prisma.oAuthIdentity.create({
    data: {
      id: nextOauthId,
      userId,
      provider,
      providerUid,
    },
  });

  return userId;
}

/**
 * `te_session` Cookie をセット (既存 `setSessionCookie` と同等)。
 * `auth.ts` は edge / node のどちらでも import されるため、
 * `next/headers` を直接呼ぶ実装にしてある。
 */
async function writeLegacySessionCookie(userId: bigint): Promise<void> {
  const c = await cookies();
  // HMAC 署名付き形式 `<userId>.<signature>` を使う
  c.set(SESSION_COOKIE_NAME, buildSessionCookieValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * AUTH_SECRET の取得。
 * - production で未設定なら起動時 throw (fail-close)。
 * - 非 production では dev フォールバックを許容。
 */
function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "dev-auth-secret-please-change";
}

/**
 * Provider の profile から email が verified かを判定する。
 *
 * - GitHub: `email_verified` (boolean) を返すが、scope に応じて欠落することもある。
 *   `verified` フィールドが true でも emails endpoint が必要。
 * - Facebook: email scope 付与時にのみ email を返す。`verified` (boolean) があれば信頼。
 * - Twitter: verified 情報を返さない → 既存ユーザーへの自動リンクは行わない。
 *
 * profile が undefined の場合や判定不能な場合は false を返す。
 */
function isProviderEmailVerified(
  provider: string,
  profile: Record<string, unknown> | undefined,
): boolean {
  if (!profile) return false;
  const v = profile.email_verified;
  if (typeof v === "boolean") return v;
  const v2 = profile.verified;
  if (provider === "facebook" && typeof v2 === "boolean") return v2;
  return false;
}

export const authConfig: NextAuthConfig = {
  // PrismaAdapter は使わない (既存スキーマと不整合のため)。JWT セッションで運用。
  session: { strategy: "jwt" },
  // 未設定の production 環境では起動時に例外を投げる (fail-close)。
  secret: requireAuthSecret(),
  trustHost: true,
  providers: [
    Twitter({
      clientId: env("TWITTER_CLIENT_ID") || env("AUTH_TWITTER_ID"),
      clientSecret:
        env("TWITTER_CLIENT_SECRET") || env("AUTH_TWITTER_SECRET"),
    }),
    Facebook({
      clientId: env("FACEBOOK_CLIENT_ID") || env("AUTH_FACEBOOK_ID"),
      clientSecret:
        env("FACEBOOK_CLIENT_SECRET") || env("AUTH_FACEBOOK_SECRET"),
    }),
    GitHub({
      clientId: env("GITHUB_CLIENT_ID") || env("AUTH_GITHUB_ID"),
      clientSecret:
        env("GITHUB_CLIENT_SECRET") || env("AUTH_GITHUB_SECRET"),
    }),
    Credentials({
      id: "credentials",
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email : "";
        const password =
          typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || user.status !== "active") {
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id.toString(),
          name: user.displayName,
          email: user.email,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return true;
      const provider = account.provider;
      if (provider === "credentials") {
        // Credentials は authorize 内で User を返しているので、id を te_session にも反映
        if (user?.id) {
          try {
            await writeLegacySessionCookie(BigInt(user.id));
          } catch {
            // BigInt 変換失敗時は無視
          }
        }
        return true;
      }

      // OAuth providers (twitter / facebook / github)
      if (
        provider === "twitter" ||
        provider === "facebook" ||
        provider === "github"
      ) {
        const providerUid =
          account.providerAccountId ?? (profile?.sub as string | undefined);
        if (!providerUid) return false;
        const email =
          (typeof user?.email === "string" && user.email) || null;
        const displayName =
          (typeof user?.name === "string" && user.name) ||
          (typeof profile?.name === "string" && (profile.name as string)) ||
          `${provider}_${providerUid}`;
        const avatarUrl =
          typeof user?.image === "string" ? user.image : null;
        const emailVerified = isProviderEmailVerified(
          provider,
          profile as Record<string, unknown> | undefined,
        );

        try {
          const result = await upsertOAuthUser({
            provider,
            providerUid,
            email,
            emailVerified,
            displayName,
            avatarUrl,
          });
          if (typeof result === "object" && "error" in result) {
            if (result.error === "email_not_verified") {
              // 既存ユーザーへの自動リンクを拒否する場合、
              // ログインページに「メール確認後に再ログイン」を促すリダイレクトを返す。
              return "/login?error=oauth_email_unverified";
            }
            return false;
          }
          const linkedUserId = result;
          // 既存 cookie 認証経路 (`te_session`) でも認識されるように設定
          await writeLegacySessionCookie(linkedUserId);
          // session.user.id に反映できるよう、user.id を上書き
          if (user) user.id = linkedUserId.toString();
        } catch (e) {
          // ログには出して signIn は失敗
          console.error("[auth] OAuth signIn link failed", e);
          return false;
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// feature lib (`web-feature-user`) の getCurrentUser() が next-auth セッションを
// 取得できるよう registry へ登録 (DI)。これにより feature → app の静的依存を
// 持たずに済む (Nx boundary `type:feature → type:app` 違反を回避)。
registerNextAuthSessionFetcher(
  auth as unknown as NextAuthSessionFetcher,
);
