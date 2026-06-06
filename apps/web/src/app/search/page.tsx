/**
 * シンプル検索ページ。
 *
 * `?q=keyword` を受け取り、エクスプローラ (`/explore`) に同等のクエリで
 * リダイレクトする。SearchBox の form action がここを向いている前提。
 *
 * クエリが無い場合は `/explore` のトップへ遷移。
 */
import { redirect } from "next/navigation";

type SearchPageSearchParams = {
  q?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageSearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  if (q) {
    redirect(`/explore?q=${encodeURIComponent(q)}`);
  }
  redirect("/explore");
}
