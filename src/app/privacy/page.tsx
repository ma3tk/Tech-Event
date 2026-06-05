/**
 * プライバシーポリシーページ (`/privacy`)
 *
 * 見出しベースの簡易ページ。
 */

export const metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <article className="mx-auto w-full max-w-3xl px-6 py-12 text-sm leading-7">
        <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
        <p className="mt-4 text-muted-foreground">
          最終更新日: 2026 年 1 月 1 日
        </p>

        <p className="mt-6">
          tech-event (以下「当サービス」) は、利用者の個人情報を尊重し、適切に
          取り扱うため、以下の方針 (以下「本ポリシー」) を定めます。
        </p>

        <h2 className="mt-10 text-xl font-bold">1. 取得する情報</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>会員登録時に提供されるメールアドレス、ニックネーム、表示名</li>
          <li>プロフィールに任意で記載される自己紹介、所属、SNS アカウント</li>
          <li>イベント申込・主催・発表等の活動履歴</li>
          <li>サービスのアクセスログ (IP アドレス、ユーザーエージェント等)</li>
          <li>Cookie を利用した行動データ</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">2. 利用目的</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>当サービスの提供、運営、改善</li>
          <li>本人確認および不正利用の防止</li>
          <li>イベント情報やお知らせの配信</li>
          <li>アクセス解析、サービス品質の向上</li>
          <li>法令に基づく対応</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">3. 第三者提供</h2>
        <p className="mt-2">
          当社は、法令で認められる場合または本人の同意がある場合を除き、個人
          情報を第三者に提供しません。
        </p>

        <h2 className="mt-10 text-xl font-bold">4. Cookie の使用</h2>
        <p className="mt-2">
          当サービスはセッション維持、利用状況の解析、レコメンデーション提供を
          目的として Cookie を使用します。利用者はブラウザの設定により Cookie の
          受け入れを拒否することができます。
        </p>

        <h2 className="mt-10 text-xl font-bold">5. 安全管理措置</h2>
        <p className="mt-2">
          当社は、取得した個人情報の漏えい、滅失、毀損を防止するため、適切な
          安全管理措置を講じます。
        </p>

        <h2 className="mt-10 text-xl font-bold">6. 開示・訂正・削除</h2>
        <p className="mt-2">
          利用者は、当社が保有する自己の個人情報について、開示、訂正、削除を
          求めることができます。ご希望の場合は当社所定の方法でご連絡ください。
        </p>

        <h2 className="mt-10 text-xl font-bold">7. プライバシーポリシーの変更</h2>
        <p className="mt-2">
          当社は、必要に応じて本ポリシーを変更することがあります。変更後の
          ポリシーは当サービス上に掲載した時点から効力を生じるものとします。
        </p>
      </article>
    </div>
  );
}
