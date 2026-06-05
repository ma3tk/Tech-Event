/**
 * 最小限の Prometheus 互換メトリクス収集。
 *
 * 外部依存 (prom-client 等) を入れず、必要最低限の counter / histogram を
 * メモリ上に保持して `/api/metrics` で text/plain 形式で公開する。
 *
 * 提供メトリクス:
 *   - `tech_event_http_requests_total{method, route, status}` (counter)
 *   - `tech_event_http_request_duration_seconds{method, route}` (histogram)
 *   - `tech_event_mail_sent_total{provider, delivered}` (counter)
 *   - `tech_event_uploads_total{provider, kind}` (counter)
 *
 * すべて process メモリ上に保持されるので、複数インスタンスを横並びで動かす
 * 場合は `/metrics` 側で aggregator (Prometheus + relabel) を立てる必要がある。
 */

type LabelValues = Record<string, string | number>;

const counters = new Map<string, Map<string, number>>();
const histograms = new Map<
  string,
  {
    buckets: number[];
    counts: Map<string, number[]>; // labelKey -> bucket counts (length = buckets.length+1, last is +Inf)
    sums: Map<string, number>;
    totals: Map<string, number>;
  }
>();

function labelsKey(labels: LabelValues | undefined): string {
  if (!labels) return "";
  const keys = Object.keys(labels).sort();
  return keys
    .map((k) => `${k}=${escapeLabelValue(String(labels[k]))}`)
    .join(",");
}

function escapeLabelValue(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

/** counter 増加 */
export function incrementCounter(
  name: string,
  labels?: LabelValues,
  by = 1,
): void {
  const key = labelsKey(labels);
  let inner = counters.get(name);
  if (!inner) {
    inner = new Map();
    counters.set(name, inner);
  }
  inner.set(key, (inner.get(key) ?? 0) + by);
}

/** histogram observation 記録 */
export function observeHistogram(
  name: string,
  value: number,
  labels?: LabelValues,
): void {
  const key = labelsKey(labels);
  let h = histograms.get(name);
  if (!h) {
    // 共通のデフォルトバケット (Prometheus client_default に近い)
    h = {
      buckets: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
      counts: new Map(),
      sums: new Map(),
      totals: new Map(),
    };
    histograms.set(name, h);
  }
  let bucketArr = h.counts.get(key);
  if (!bucketArr) {
    bucketArr = new Array(h.buckets.length + 1).fill(0);
    h.counts.set(key, bucketArr);
  }
  for (let i = 0; i < h.buckets.length; i++) {
    if (value <= h.buckets[i]) {
      bucketArr[i] += 1;
    }
  }
  // +Inf bucket
  bucketArr[h.buckets.length] += 1;
  h.sums.set(key, (h.sums.get(key) ?? 0) + value);
  h.totals.set(key, (h.totals.get(key) ?? 0) + 1);
}

function decodeLabelKey(key: string): string {
  if (!key) return "";
  // key = "k1=v1,k2=v2"
  return key
    .split(",")
    .map((p) => {
      const idx = p.indexOf("=");
      if (idx < 0) return p;
      const k = p.slice(0, idx);
      const v = p.slice(idx + 1);
      return `${k}="${v}"`;
    })
    .join(",");
}

function buildLabelString(key: string, extra?: string): string {
  const parts: string[] = [];
  if (key) parts.push(decodeLabelKey(key));
  if (extra) parts.push(extra);
  return parts.length === 0 ? "" : `{${parts.join(",")}}`;
}

/** Prometheus text exposition format 形式で書き出す。 */
export function renderMetrics(): string {
  const lines: string[] = [];
  for (const [name, inner] of counters) {
    lines.push(`# TYPE ${name} counter`);
    for (const [key, value] of inner) {
      lines.push(`${name}${buildLabelString(key)} ${value}`);
    }
  }
  for (const [name, h] of histograms) {
    lines.push(`# TYPE ${name} histogram`);
    for (const [key, bucketArr] of h.counts) {
      for (let i = 0; i < h.buckets.length; i++) {
        lines.push(
          `${name}_bucket${buildLabelString(key, `le="${h.buckets[i]}"`)} ${bucketArr[i]}`,
        );
      }
      lines.push(
        `${name}_bucket${buildLabelString(key, 'le="+Inf"')} ${bucketArr[h.buckets.length]}`,
      );
      lines.push(`${name}_sum${buildLabelString(key)} ${h.sums.get(key) ?? 0}`);
      lines.push(
        `${name}_count${buildLabelString(key)} ${h.totals.get(key) ?? 0}`,
      );
    }
  }
  // process metrics
  lines.push(`# TYPE tech_event_process_uptime_seconds gauge`);
  lines.push(`tech_event_process_uptime_seconds ${process.uptime()}`);
  return lines.join("\n") + "\n";
}

/** テスト用: 全状態をクリア。 */
export function resetMetricsForTesting(): void {
  counters.clear();
  histograms.clear();
}

/** 標準メトリクス名 (共通定数) */
export const METRIC_NAMES = {
  HTTP_REQUESTS_TOTAL: "tech_event_http_requests_total",
  HTTP_REQUEST_DURATION_SECONDS: "tech_event_http_request_duration_seconds",
  MAIL_SENT_TOTAL: "tech_event_mail_sent_total",
  UPLOADS_TOTAL: "tech_event_uploads_total",
  ERRORS_TOTAL: "tech_event_errors_total",
} as const;
