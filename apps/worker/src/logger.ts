/**
 * Worker 用ロガー (pino)。
 *
 * Next.js 側の `@/lib/logger` をそのまま使うと Next.js 依存が芋づる式に来るため、
 * worker は独自の最小 pino を持つ。フォーマットは dev = pretty / prod = JSON。
 */
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "tech-event-worker" },
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
});
