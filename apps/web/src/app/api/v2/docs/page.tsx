/**
 * 公開 REST API (/api/v2/*) のざっくり仕様一覧ページ。
 *
 * - 静的に近い HTML を返す (DB アクセスなし)。
 * - 認証/レート制限/エンドポイント表/curl サンプルを列挙。
 */

export const dynamic = "force-static";

export const metadata = {
  title: "tech-event 公開 API ドキュメント",
  description: "tech-event の公開 REST API (/api/v2) の仕様一覧と curl サンプル。",
};

type Endpoint = {
  method: string;
  path: string;
  summary: string;
  query: { name: string; desc: string }[];
  example: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v2/events/",
    summary: "イベント検索。複数条件を AND で結合する。",
    query: [
      { name: "keyword", desc: "title/catch/description/address への AND 部分一致 (複数可)" },
      { name: "event_id", desc: "イベントID (カンマ区切り複数可)" },
      { name: "nickname", desc: "参加者ニックネーム (カンマ区切り複数可)" },
      { name: "owner_nickname", desc: "管理者ニックネーム (カンマ区切り複数可)" },
      { name: "group_id", desc: "グループID (カンマ区切り複数可)" },
      { name: "prefecture", desc: "都道府県スラグ (`online` で online のみ)" },
      { name: "online", desc: "`true`/`1` で online のみ" },
      { name: "ym", desc: "開催年月 (yyyymm)" },
      { name: "ymd", desc: "開催年月日 (yyyymmdd)" },
      { name: "order", desc: "1=updated_at desc, 2=started_at asc, 3=accepted desc (default: 1)" },
      { name: "start", desc: "開始位置 (1-origin, default: 1)" },
      { name: "count", desc: "取得件数 (1〜100, default: 10)" },
    ],
    example: `curl 'http://localhost:3000/api/v2/events/?keyword=AI&count=2' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/groups/",
    summary: "グループ検索。subdomain 完全一致のみ。",
    query: [
      { name: "subdomain", desc: "サブドメイン (カンマ区切り複数可、最大100)" },
      { name: "start", desc: "開始位置 (default: 1)" },
      { name: "count", desc: "取得件数 (default: 10, max: 100)" },
    ],
    example: `curl 'http://localhost:3000/api/v2/groups/?subdomain=findy,layerx' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/users/",
    summary: "ユーザー検索 (ニックネーム完全一致)。",
    query: [
      { name: "nickname", desc: "ニックネーム (カンマ区切り複数可、最大100)" },
      { name: "start", desc: "開始位置" },
      { name: "count", desc: "取得件数" },
    ],
    example: `curl 'http://localhost:3000/api/v2/users/?nickname=fast_moon_169,calm_owl_42' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/users/{nickname}/groups/",
    summary: "ユーザーの所属グループ一覧。",
    query: [
      { name: "start", desc: "開始位置" },
      { name: "count", desc: "取得件数" },
    ],
    example: `curl 'http://localhost:3000/api/v2/users/fast_moon_169/groups/' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/users/{nickname}/attended_events/",
    summary: "ユーザーが参加 (accepted/attended) したイベント一覧。",
    query: [
      { name: "start", desc: "開始位置" },
      { name: "count", desc: "取得件数" },
    ],
    example: `curl 'http://localhost:3000/api/v2/users/fast_moon_169/attended_events/' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/users/{nickname}/presenter_events/",
    summary: "ユーザーが発表したイベント一覧。",
    query: [
      { name: "start", desc: "開始位置" },
      { name: "count", desc: "取得件数" },
    ],
    example: `curl 'http://localhost:3000/api/v2/users/fast_moon_169/presenter_events/' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/events/{id}/presentations/",
    summary: "イベントの発表資料一覧。",
    query: [
      { name: "start", desc: "開始位置" },
      { name: "count", desc: "取得件数" },
    ],
    example: `curl 'http://localhost:3000/api/v2/events/1/presentations/' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/calendars/",
    summary:
      "カレンダー検索。slug 完全一致 / キーワード部分一致。subscriberCount 降順。",
    query: [
      { name: "slug", desc: "slug 完全一致 (カンマ区切り複数可、最大 100)" },
      {
        name: "keyword",
        desc: "name/description/slug への AND 部分一致 (カンマ区切り複数可)",
      },
      { name: "start", desc: "開始位置 (default: 1)" },
      { name: "count", desc: "取得件数 (default: 10, max: 100)" },
    ],
    example: `curl 'http://localhost:3000/api/v2/calendars/?keyword=AI' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
  {
    method: "GET",
    path: "/api/v2/calendars/{slug}/events/",
    summary:
      "指定カレンダーに追加されたイベント一覧 (開催日昇順)。",
    query: [
      { name: "start", desc: "開始位置 (default: 1)" },
      { name: "count", desc: "取得件数 (default: 10, max: 100)" },
    ],
    example: `curl 'http://localhost:3000/api/v2/calendars/ai-developers/events/' \\
  -H 'X-API-Key: dev-public-api-key-please-change' \\
  -H 'User-Agent: tech-event-cli/1.0'`,
  },
];

export default function PublicApiDocsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">tech-event 公開 API (v2)</h1>
      <p className="mb-4 text-sm text-gray-700">
        connpass v2 互換 (subset) の読み取り専用 REST API です。
        本番リリース前のため、認証キーは固定のサンプル値が設定されています。
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">共通仕様</h2>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li>
            ベースURL: <code className="px-1 bg-gray-100">/api/v2/</code>
          </li>
          <li>すべて HTTP <strong>GET</strong> メソッド。</li>
          <li>
            <strong>認証必須</strong>: HTTPリクエストヘッダ
            <code className="px-1 bg-gray-100">X-API-Key</code> に発行値を設定する。未指定 / 不一致は
            401。
          </li>
          <li>
            <strong>User-Agent 必須</strong>: 空または "curl" 単独は 403。
          </li>
          <li>
            レート制限: APIキー単位で <strong>1 req / 秒</strong>。超過時 429。
          </li>
          <li>レスポンス: <code className="px-1 bg-gray-100">application/json; charset=utf-8</code></li>
          <li>
            CORS: <code className="px-1 bg-gray-100">Access-Control-Allow-Origin: *</code>
          </li>
          <li>
            一覧系のレスポンス共通フィールド:
            <code className="px-1 bg-gray-100">results_start</code>,
            <code className="px-1 bg-gray-100">results_returned</code>,
            <code className="px-1 bg-gray-100">results_available</code>
          </li>
          <li>
            ページング: <code className="px-1 bg-gray-100">start</code> (1-origin, 既定 1) /
            <code className="px-1 bg-gray-100">count</code> (既定 10, 最大 100)
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">エンドポイント一覧</h2>
        <div className="space-y-6">
          {ENDPOINTS.map((ep) => (
            <article
              key={ep.path}
              className="border rounded p-4 bg-white shadow-sm"
            >
              <h3 className="font-mono text-sm font-bold mb-1">
                <span className="text-green-700">{ep.method}</span> {ep.path}
              </h3>
              <p className="text-sm text-gray-700 mb-3">{ep.summary}</p>
              <details className="mb-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  クエリパラメータ ({ep.query.length})
                </summary>
                <ul className="mt-2 list-disc pl-6 text-sm space-y-1">
                  {ep.query.map((q) => (
                    <li key={q.name}>
                      <code className="px-1 bg-gray-100">{q.name}</code>:{" "}
                      {q.desc}
                    </li>
                  ))}
                </ul>
              </details>
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                {ep.example}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">エラーコード</h2>
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">ステータス</th>
              <th className="border px-2 py-1 text-left">状況</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">400</td>
              <td className="border px-2 py-1">クエリ型不正</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">401</td>
              <td className="border px-2 py-1">X-API-Key 不正/未指定</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">403</td>
              <td className="border px-2 py-1">User-Agent 未送信 (空 / "curl" 単独)</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">404</td>
              <td className="border px-2 py-1">該当リソースなし</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">429</td>
              <td className="border px-2 py-1">レート制限超過 (1 req/sec)</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
