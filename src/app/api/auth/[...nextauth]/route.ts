/**
 * Auth.js v5 (next-auth@beta) の Route Handler。
 *
 * root `auth.ts` で生成した `handlers` (= {GET, POST}) を再エクスポート。
 *
 * - GET: provider一覧 / signIn 開始 / callback / signOut フローを処理
 * - POST: signIn form action / signOut form action 等
 *
 * 既存の `/api/auth/login`, `/api/auth/dev-login`, `/api/auth/magic-link/*`
 * は具体的なルートとして残るため、catch-all (`[...nextauth]`) より優先される。
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
