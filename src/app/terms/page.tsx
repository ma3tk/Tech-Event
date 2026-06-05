/**
 * 利用規約ページ (`/terms`)
 *
 * 見出しベースの簡易ページ。実際の文面はリーガル確認後に差し替え。
 */

export const metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <article className="mx-auto w-full max-w-3xl px-6 py-12 text-sm leading-7">
        <h1 className="text-3xl font-bold">利用規約</h1>
        <p className="mt-4 text-muted-foreground">
          最終更新日: 2026 年 1 月 1 日
        </p>

        <p className="mt-6">
          本利用規約 (以下「本規約」) は、tech-event (以下「当サービス」) の
          利用条件を定めるものです。利用者は本規約に同意の上、当サービスを
          利用するものとします。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 1 条 (適用)</h2>
        <p className="mt-2">
          本規約は、当サービスの利用に関する一切の関係に適用されます。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 2 条 (利用登録)</h2>
        <p className="mt-2">
          当サービスは、登録希望者が本規約に同意の上、所定の方法で登録申請を
          行い、当社がこれを承認することによって完了するものとします。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 3 条 (アカウント管理)</h2>
        <p className="mt-2">
          利用者は、自己の責任においてアカウント情報を適切に管理するものとし、
          これを第三者に利用させ、または貸与、譲渡してはなりません。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 4 条 (禁止事項)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>他の利用者または第三者の権利を侵害する行為</li>
          <li>当サービスの運営を妨害する行為</li>
          <li>その他、当社が不適切と判断する行為</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">第 5 条 (サービス内容の変更等)</h2>
        <p className="mt-2">
          当社は、利用者への事前の通知なく、当サービスの内容を変更、追加、または
          終了することができるものとします。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 6 条 (免責事項)</h2>
        <p className="mt-2">
          当サービスは、利用者が掲載した情報の正確性、有用性、適法性等を保証する
          ものではありません。当サービスを通じて行われた取引や交流に関するトラブルに
          ついて、当社は一切の責任を負いません。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 7 条 (規約の変更)</h2>
        <p className="mt-2">
          当社は、必要と判断したときは、利用者へ通知することなく本規約を変更
          することができるものとします。
        </p>

        <h2 className="mt-10 text-xl font-bold">第 8 条 (準拠法・裁判管轄)</h2>
        <p className="mt-2">
          本規約の解釈にあたっては、日本法を準拠法とします。当サービスに関して
          紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。
        </p>
      </article>
    </div>
  );
}
