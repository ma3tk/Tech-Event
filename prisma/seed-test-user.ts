/**
 * テストユーザー (`test@example.com` / `password`) を冪等に追加するシード差分。
 *
 * 実行: `pnpm tsx prisma/seed-test-user.ts`
 *
 * - メインシード (`prisma/seed.ts`) を流すと cleanup で消えるので、
 *   毎回シード後にこのスクリプトを流すか E2E 前に流す。
 * - 既に同じ email のユーザーが存在すれば passwordHash を上書きするだけで、
 *   その他のフィールドは変更しない。
 */

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/index.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password";
const TEST_NICKNAME = "test_user";
const TEST_DISPLAY_NAME = "テストユーザー";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: "active" },
    });
    console.log(
      `[seed-test-user] updated existing user (id=${existing.id.toString()}, email=${TEST_EMAIL})`,
    );
    return;
  }

  // 新規作成: 既存 user の id と衝突しない値を採番する
  const maxIdRow = await prisma.user.aggregate({ _max: { id: true } });
  const nextId = (maxIdRow._max.id ?? BigInt(0)) + BigInt(1);

  // nickname の衝突回避 (`test_user` が他で使われていれば suffix を付ける)
  let nickname = TEST_NICKNAME;
  for (let i = 0; i < 50; i++) {
    const collision = await prisma.user.findUnique({
      where: { nickname },
    });
    if (!collision) break;
    nickname = `${TEST_NICKNAME}_${i + 2}`;
  }

  const created = await prisma.user.create({
    data: {
      id: nextId,
      nickname,
      displayName: TEST_DISPLAY_NAME,
      email: TEST_EMAIL,
      passwordHash,
      emailVerifiedAt: new Date(),
      status: "active",
      avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=${nickname}`,
      bio: "E2E テスト用に追加されたユーザーです。",
    },
  });
  console.log(
    `[seed-test-user] created user (id=${created.id.toString()}, email=${TEST_EMAIL}, nickname=${nickname})`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
