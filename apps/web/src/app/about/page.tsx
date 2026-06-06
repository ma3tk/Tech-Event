/**
 * サービス紹介ページ (`/about`)
 *
 * フッターの「サービスについて」リンクから到達する静的紹介ページ。
 */

import Link from "next/link";

export const metadata = {
  title: "tech-event について",
  description: "tech-event は、エンジニアの勉強会やコミュニティイベントを集約するプラットフォームです。",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <article className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">tech-event について</h1>

        <p className="mt-4 text-base leading-7 text-muted-foreground">
          tech-event は、エンジニアやデザイナー、データサイエンティストといった
          技術者のための勉強会・カンファレンス・もくもく会を発見し、参加できる
          コミュニティプラットフォームです。
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">できること</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-7">
            <li>勉強会やカンファレンスを検索 / カレンダーで探す</li>
            <li>参加申し込み・受付・出席管理</li>
            <li>コミュニティ (グループ) を作って継続開催</li>
            <li>発表資料を集約し、ポートフォリオとして公開</li>
            <li>気になるイベントをブックマーク / 通知で受け取る</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">ミッション</h2>
          <p className="text-sm leading-7">
            テクノロジーの学びと出会いをもっと身近に。地理・組織の垣根を越えて、
            すべての技術者が知識を共有し、コミュニティを通じて成長できる場をつくります。
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">使い方</h2>
          <ol className="list-decimal space-y-2 pl-6 text-sm leading-7">
            <li>
              <Link href="/signup" className="text-link hover:text-link-hover">
                アカウントを作成
              </Link>
              し、興味のあるタグを選びます。
            </li>
            <li>
              <Link href="/event" className="text-link hover:text-link-hover">
                イベントを探す
              </Link>
              か、
              <Link href="/series" className="text-link hover:text-link-hover">
                グループを探す
              </Link>
              から興味のあるコミュニティを見つけます。
            </li>
            <li>気になるイベントに申し込んで参加します。</li>
            <li>自分でも勉強会を主催してみましょう。</li>
          </ol>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">運営者</h2>
          <p className="text-sm leading-7">
            tech-event は、connpass を参考にした学習用プロジェクトです。
          </p>
        </section>

        <div className="mt-12 flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-hover"
          >
            今すぐ始める
          </Link>
          <Link
            href="/event"
            className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50"
          >
            イベントを探す
          </Link>
        </div>
      </article>
    </div>
  );
}
