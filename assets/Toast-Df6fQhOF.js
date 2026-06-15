import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,p as i,s as a,u as o}from"./blocks-DSdAlscu.js";import{t as s}from"./mdx-react-shim-DaZ3R4gt.js";function c(e){let t={a:`a`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(a,{title:`Design System/Toast`}),`
`,(0,u.jsx)(r,{children:`Toast / Notification`}),`
`,(0,u.jsx)(o,{children:`sonner + URL ベースの ToastListener パターン`}),`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.code,{children:`tech-event`}),` は Toast の表示に `,(0,u.jsx)(t.a,{href:`https://sonner.emilkowal.ski/`,rel:`nofollow`,children:`sonner`}),` を採用し、Server Action と組み合わせるために `,(0,u.jsxs)(t.strong,{children:[`URL クエリ `,(0,u.jsx)(t.code,{children:`?toast=<key>`})]}),` を経由する独自パターン (`,(0,u.jsx)(t.code,{children:`ToastListener`}),`) を使います。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`1-アーキテクチャ`,children:`1. アーキテクチャ`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{children:`Server Action (例: applyToEvent)
      ↓ redirect(\`/event/\${id}?toast=joined\`)
ブラウザ遷移
      ↓
ToastListener (Client Component, ルートレイアウトに常駐)
      ↓ ?toast=joined を読み取る
      ↓ toast.success("✓ 参加申込しました")
      ↓ router.replace で ?toast を URL から削除
sonner が画面右上に通知表示
`})}),`
`,(0,u.jsx)(t.h3,{id:`なぜ-url-ベース`,children:`なぜ URL ベース?`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`Server Action からトーストを出すための公式 API がない`}),` ため`]}),`
`,(0,u.jsxs)(t.li,{children:[`ページリロード時に `,(0,u.jsx)(t.strong,{children:`再発火しない`}),` (URL から削除済み)`]}),`
`,(0,u.jsxs)(t.li,{children:[`Server → Client への副作用伝達が `,(0,u.jsx)(t.strong,{children:`状態ではなく URL`}),` で済む = SSR と相性が良い`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`2-既知の-toast-key-一覧`,children:`2. 既知の toast key 一覧`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`key`}),(0,u.jsx)(t.th,{children:`type`}),(0,u.jsx)(t.th,{children:`メッセージ`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`joined`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`✓ 参加申込しました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`cancelled`})}),(0,u.jsx)(t.td,{children:`info`}),(0,u.jsx)(t.td,{children:`ℹ︎ 参加をキャンセルしました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`bookmarked`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`♡ ブックマークしました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`unbookmarked`})}),(0,u.jsx)(t.td,{children:`info`}),(0,u.jsx)(t.td,{children:`ℹ︎ ブックマークを解除しました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`comment-posted`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`✓ コメント投稿しました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`group-created`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`✓ グループを作成しました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`calendar-created`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`✓ カレンダーを作成しました`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`saved`})}),(0,u.jsx)(t.td,{children:`success`}),(0,u.jsx)(t.td,{children:`✓ 保存しました`})]})]})]}),`
`,(0,u.jsxs)(t.p,{children:[`新しい key を追加する場合は `,(0,u.jsx)(t.code,{children:`src/components/ToastListener.tsx`}),` の `,(0,u.jsx)(t.code,{children:`MESSAGES`}),` に登録 (= TS の `,(0,u.jsx)(t.code,{children:`ToastKey`}),` 型に追加することで握り潰し漏れを防ぐ)。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`3-使い方`,children:`3. 使い方`}),`
`,(0,u.jsx)(t.h3,{id:`31-server-action-から`,children:`3.1 Server Action から`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-ts`,children:`"use server";
import { redirect } from "next/navigation";

export async function applyToEvent(eventId: string) {
  // ... DB 更新 ...
  redirect(\`/event/\${eventId}?toast=joined\`);
}
`})}),`
`,(0,u.jsx)(t.h3,{id:`32-client-component-から-直接`,children:`3.2 Client Component から (直接)`}),`
`,(0,u.jsx)(t.p,{children:`通常は URL 経由を推奨しますが、純粋にクライアント側で完結する操作 (例: クリップボードコピー) は直接呼べます:`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`"use client";
import { toast } from "@/components/ui/toast";

function CopyButton() {
  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        toast.success("URL をコピーしました");
      }}
    >
      コピー
    </Button>
  );
}
`})}),`
`,(0,u.jsx)(t.h3,{id:`33-エラー時`,children:`3.3 エラー時`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`toast.error("送信に失敗しました。時間をおいて再度お試しください。");
`})}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`4-good--bad`,children:`4. Good / Bad`}),`
`,(0,u.jsx)(t.h3,{id:`-good`,children:`✓ Good`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`「成功 / 失敗」など `,(0,u.jsx)(t.strong,{children:`短く`}),` て `,(0,u.jsx)(t.strong,{children:`追加情報がない`}),` 通知に使う`]}),`
`,(0,u.jsxs)(t.li,{children:[`Server Action のフィードバックには `,(0,u.jsx)(t.code,{children:`?toast=...`}),` 経由を使う`]}),`
`,(0,u.jsxs)(t.li,{children:[`重要なエラー (権限不足 / バリデーション失敗) は Toast ではなくページ内に `,(0,u.jsx)(t.code,{children:`ErrorState`}),` を出す`]}),`
`]}),`
`,(0,u.jsx)(t.h3,{id:`-bad`,children:`✗ Bad`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsx)(t.li,{children:`フォームのバリデーションエラーを Toast で出す (= 入力近くに出すべき)`}),`
`,(0,u.jsx)(t.li,{children:`リダイレクト無しの Server Action 直接呼出で Toast 出そうとする (= 状態管理が破綻)`}),`
`,(0,u.jsx)(t.li,{children:`連続して 5 個以上の Toast を出す (= sonner が積み上げてしまう。1 操作 = 1 toast)`}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`5-アクセシビリティ`,children:`5. アクセシビリティ`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`sonner は内部で `,(0,u.jsx)(t.code,{children:`aria-live="polite"`}),` (success/info) / `,(0,u.jsx)(t.code,{children:`aria-live="assertive"`}),` (error) を出す`]}),`
`,(0,u.jsx)(t.li,{children:`フォーカスは Toast に移動しない (= 操作中の入力を邪魔しない)`}),`
`,(0,u.jsxs)(t.li,{children:[`自動消滅は 4 秒 (sonner デフォルト)。詳細は `,(0,u.jsx)(t.code,{children:`<Toaster>`}),` の設定で上書き可`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`6-関連`,children:`6. 関連`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`実装: `,(0,u.jsx)(t.code,{children:`src/components/ui/toast.tsx`}),` (Toaster wrapper), `,(0,u.jsx)(t.code,{children:`src/components/ToastListener.tsx`})]}),`
`,(0,u.jsxs)(t.li,{children:[`Stories: `,(0,u.jsx)(t.code,{children:`UI/Toast`})]}),`
`,(0,u.jsxs)(t.li,{children:[`アクションラッパ: `,(0,u.jsx)(t.code,{children:`src/hooks/useActionToast.ts`}),` (Server Action 結果を URL 経由で Toast 化)`]}),`
`]})]})}function l(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,u.jsx)(t,{...e,children:(0,u.jsx)(c,{...e})}):c(e)}var u;e((()=>{u=t(),s(),i()}))();export{l as default};