/**
 * グループ編集ページ。
 *
 * - owner/admin のみアクセス可
 * - 権限なしの場合は 404 (notFound) を返す
 * - 既存値をフォームに復元
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateGroup } from "@/app/actions/group-actions";
import MarkdownEditor from "@/components/MarkdownEditorDynamic";
import ImageUploader from "@/components/ImageUploader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ subdomain: string }>;
};

export default async function GroupEditPage({ params }: PageProps) {
  const { subdomain } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/group/${subdomain}/edit`)}`);
  }

  const group = await prisma.group.findUnique({
    where: { subdomain },
  });
  if (!group) notFound();

  // 権限チェック
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  if (!admin || (admin.role !== "owner" && admin.role !== "admin")) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href={`/group/${group.subdomain}`} className="hover:underline">
          ← {group.name} に戻る
        </Link>
      </nav>
      <h1 className="text-2xl font-bold">グループを編集する</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        基本情報を更新します。サブドメインは変更できません。
      </p>

      <form
        action={updateGroup}
        method="post"
        className="mt-6 space-y-6 rounded-lg border border-border bg-surface p-6"
        data-testid="group-edit-form"
      >
        <input type="hidden" name="groupId" value={group.id.toString()} />
        <input type="hidden" name="subdomain" value={group.subdomain} />

        <div>
          <p className="text-sm font-medium text-foreground">
            サブドメイン (変更不可)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <code>{group.subdomain}</code>.tech-event
          </p>
        </div>

        <Field label="グループ名" htmlFor="name" required>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={group.name}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="サブタイトル" htmlFor="subtitle">
          <input
            id="subtitle"
            name="subtitle"
            type="text"
            maxLength={200}
            defaultValue={group.subtitle ?? ""}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field label="主催組織" htmlFor="organization">
          <input
            id="organization"
            name="organization"
            type="text"
            maxLength={200}
            defaultValue={group.organization ?? ""}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <Field
          label="グループの説明 (Markdown)"
          htmlFor="description"
          help="GFM Markdown が利用できます。"
        >
          <MarkdownEditor
            id="description"
            name="description"
            rows={10}
            maxLength={20_000}
            defaultValue={group.description ?? ""}
            placeholder="## はじめに&#10;このグループでは..."
            testIdPrefix="group-description-editor"
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="カバー画像" htmlFor="coverImageUrl">
            <ImageUploader
              name="coverImageUrl"
              defaultValue={group.coverImageUrl ?? ""}
              kind="group-cover"
              aspectRatio="1200 / 630"
              label="カバー画像を選択"
            />
          </Field>
          <Field label="サムネイル" htmlFor="thumbnailUrl">
            <ImageUploader
              name="thumbnailUrl"
              defaultValue={group.thumbnailUrl ?? ""}
              kind="group-thumb"
              aspectRatio="1 / 1"
              label="サムネイルを選択"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Field label="公式サイト" htmlFor="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              maxLength={2000}
              defaultValue={group.websiteUrl ?? ""}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="X アカウント" htmlFor="xAccount" help="@ なし">
            <input
              id="xAccount"
              name="xAccount"
              type="text"
              maxLength={100}
              defaultValue={group.xAccount ?? ""}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
          <Field label="Facebook ページ URL" htmlFor="facebookUrl">
            <input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              maxLength={2000}
              defaultValue={group.facebookUrl ?? ""}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </Field>
        </div>

        <Field
          label="Slack Webhook URL"
          htmlFor="slackWebhookUrl"
          help="設定すると、イベント公開・コメント投稿・抽選結果発表時にこの URL へ通知が飛びます。"
        >
          <input
            id="slackWebhookUrl"
            name="slackWebhookUrl"
            type="url"
            maxLength={2000}
            defaultValue={group.slackWebhookUrl ?? ""}
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            data-testid="group-slack-webhook-url"
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            href={`/group/${group.subdomain}`}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-brand-orange-soft"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            data-testid="group-edit-submit"
            className="inline-flex h-10 items-center rounded-md bg-brand-orange px-5 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
          >
            変更を保存
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  help,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-status-cancelled-fg">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
