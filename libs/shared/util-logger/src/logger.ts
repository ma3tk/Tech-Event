/**
 * 構造化ロガー (pino ベース)。
 *
 * - production: JSON 行 (stdout) → Datadog / Loki / CloudWatch 等で集約
 * - development: pino-pretty で色付き整形
 * - level は `LOG_LEVEL` 環境変数で上書き可能 (`error|warn|info|debug|trace`)
 * - correlation-id は middleware が `x-request-id` を付与し、`logger.withRequestId()`
 *   で child logger を生成して使う想定
 *
 * 使用例:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ userId: "u1" }, "user logged in");
 *   logger.error({ err }, "magic-link send failed");
 *
 * Edge runtime では pino が動かないので `consoleLogger` を返す。
 */
import type { Logger } from "pino";

let _logger: Logger | null = null;
let _consoleFallback: Logger | null = null;

const LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase();

function buildPinoLogger(): Logger {
  // pino を node 限定で同期 require (edge では呼ばれない)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pino = require("pino") as typeof import("pino");
  const isProd = process.env.NODE_ENV === "production";
  const pinoFn = ((pino as unknown as { default?: typeof pino }).default ??
    pino) as typeof pino;
  return pinoFn({
    level: LEVEL,
    base: {
      env: process.env.NODE_ENV ?? "development",
      service: "tech-event",
    },
    // production 以外は pretty 出力
    transport: isProd
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname,service,env",
            singleLine: false,
          },
        },
    redact: {
      paths: [
        "req.headers.cookie",
        "req.headers.authorization",
        '*.password',
        '*.token',
        '*.secret',
      ],
      remove: false,
    },
  });
}

/** Edge runtime 等で pino を使えないときの最小 fallback。 */
function buildConsoleLogger(): Logger {
  const noop = (..._args: unknown[]): void => undefined;
  const make = (level: string) =>
    function logFn(this: unknown, ...args: unknown[]) {
      // 第一引数が object なら structured, それ以外なら message
      const ts = new Date().toISOString();
      const payload =
        typeof args[0] === "object" && args[0] !== null
          ? { ...(args[0] as object), msg: args[1] ?? "", level, ts }
          : { msg: args[0] ?? "", level, ts };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload));
    };
  const fake = {
    level: LEVEL,
    fatal: make("fatal"),
    error: make("error"),
    warn: make("warn"),
    info: make("info"),
    debug: make("debug"),
    trace: make("trace"),
    silent: noop,
    child: () => fake,
  } as unknown as Logger;
  return fake;
}

/**
 * 共有ロガー (singleton)。
 *
 * Next.js の edge runtime や client side (誤って import した場合) を考慮し、
 * pino のロードに失敗したら console fallback を返す。
 */
export const logger: Logger = (() => {
  const isEdge = process.env.NEXT_RUNTIME === "edge";
  const isBrowser = typeof window !== "undefined";
  if (isEdge || isBrowser) {
    if (_consoleFallback) return _consoleFallback;
    _consoleFallback = buildConsoleLogger();
    return _consoleFallback;
  }
  if (_logger) return _logger;
  try {
    _logger = buildPinoLogger();
    return _logger;
  } catch {
    _consoleFallback = buildConsoleLogger();
    return _consoleFallback;
  }
})();

/**
 * リクエスト単位の correlation-id を bind した child logger を返す。
 *
 * 使用例:
 *   import { headers } from "next/headers";
 *   const log = withRequestId(await headers());
 *   log.info("payment processed");
 */
export function withRequestId(
  reqHeaders: { get(name: string): string | null } | undefined | null,
): Logger {
  const rid =
    reqHeaders?.get("x-request-id") ?? reqHeaders?.get("x-correlation-id");
  if (!rid) return logger;
  return logger.child({ requestId: rid });
}

/**
 * 任意 key/value を child logger に bind する。
 */
export function withContext(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
