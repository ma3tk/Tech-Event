import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,p as i,s as a,u as o}from"./blocks-DyqvvloQ.js";import{t as s}from"./mdx-react-shim-Co4r-mY_.js";function c(e){let t={code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(a,{title:`Design System/Empty States`}),`
`,(0,u.jsx)(r,{children:`Empty / Error / Loading パターン`}),`
`,(0,u.jsx)(o,{children:`「何もないとき」「失敗したとき」「読み込み中」の 3 つを primitives 化`}),`
`,(0,u.jsx)(t.p,{children:`データに依存する画面では必ず 3 つの状態を考慮する必要があります:`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`状態`}),(0,u.jsx)(t.th,{children:`コンポーネント`}),(0,u.jsx)(t.th,{children:`使うべき場面`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Empty (0件)`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`EmptyState`})}),(0,u.jsx)(t.td,{children:`検索結果が空 / リストにデータがない`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Error`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`ErrorState`})}),(0,u.jsx)(t.td,{children:`取得失敗 / 例外発生 / 権限不足`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Loading`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`LoadingState`})}),(0,u.jsx)(t.td,{children:`データ取得待ち / 送信中 / Suspense フォールバック`})]})]})]}),`
`,(0,u.jsxs)(t.p,{children:[`これら 3 つは `,(0,u.jsx)(t.code,{children:`src/components/ui/{empty,error,loading}-state.tsx`}),` として primitive 化されており、Storybook では `,(0,u.jsx)(t.code,{children:`UI/EmptyState`}),`, `,(0,u.jsx)(t.code,{children:`UI/ErrorState`}),`, `,(0,u.jsx)(t.code,{children:`UI/LoadingState`}),` で確認できます。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`1-emptystate`,children:`1. EmptyState`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";

<EmptyState
  icon={SearchX}
  title="該当するイベントが見つかりませんでした"
  description="検索条件を変えて再度お試しください。"
  action={<Button variant="outline">検索条件をリセット</Button>}
/>
`})}),`
`,(0,u.jsx)(t.p,{children:`ポイント:`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`role="status"`}),` で SR に状態通知`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`border-dashed`}),` 枠で「ここに将来コンテンツが入ります」を視覚的に示唆`]}),`
`,(0,u.jsx)(t.li,{children:`アイコンは任意 (装飾)。title が一次情報、description は補足、action は次の操作 (CTA)`}),`
`]}),`
`,(0,u.jsx)(t.p,{children:`適用済みページ:`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`/explore`}),` 検索結果 0 件時`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`/notifications`}),` 通知 0 件時`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`2-errorstate`,children:`2. ErrorState`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import { ErrorState } from "@/components/ui/error-state";

<ErrorState
  error={new Error("ネットワーク接続に失敗しました")}
  retry={() => location.reload()}
/>
`})}),`
`,(0,u.jsx)(t.p,{children:`ポイント:`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`role="alert"`}),` + `,(0,u.jsx)(t.code,{children:`aria-live="assertive"`}),` で SR に即座に通知`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`error`}),` は `,(0,u.jsx)(t.code,{children:`Error`}),` インスタンス / 文字列 / unknown いずれも受け付け、`,(0,u.jsx)(t.code,{children:`.message`}),` を抽出`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`retry`}),` を渡したときだけ再試行ボタンが出る (= 復旧不能エラーでは action なし)`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`3-loadingstate`,children:`3. LoadingState`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import { LoadingState } from "@/components/ui/loading-state";

{/* 短時間 (< 2s) のフォーム送信中 */}
<LoadingState variant="spinner" />

{/* ページレベル / リスト読み込み */}
<LoadingState variant="skeleton" skeletonRows={5} />

{/* 継続感のある「処理中」表示 */}
<LoadingState variant="dots" />
`})}),`
`,(0,u.jsx)(t.p,{children:`ポイント:`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`role="status"`}),` + `,(0,u.jsx)(t.code,{children:`aria-live="polite"`}),` + `,(0,u.jsx)(t.code,{children:`aria-busy="true"`})]}),`
`,(0,u.jsxs)(t.li,{children:[`アニメーションは `,(0,u.jsx)(t.code,{children:`prefers-reduced-motion`}),` を尊重 (globals.css のグローバルセーフネット)`]}),`
`]}),`
`,(0,u.jsx)(t.p,{children:`variant 選定ガイド:`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`待ち時間`}),(0,u.jsx)(t.th,{children:`推奨 variant`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`< 1 秒`}),(0,u.jsx)(t.td,{children:`表示しない (フリッカ防止)`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`1〜2 秒`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`spinner`})})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`2〜10 秒 (リスト)`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`skeleton`})})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`不確定 (処理中)`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`dots`})})]})]})]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`4-good--bad`,children:`4. Good / Bad`}),`
`,(0,u.jsx)(t.h3,{id:`-good`,children:`✓ Good`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`empty / error / loading で 3 つの状態を `,(0,u.jsx)(t.strong,{children:`明示的に`}),`書く`]}),`
`,(0,u.jsx)(t.li,{children:`error には可能なら retry を渡す`}),`
`,(0,u.jsx)(t.li,{children:`empty には次の操作 (action) を 1 つ提示する`}),`
`]}),`
`,(0,u.jsx)(t.h3,{id:`-bad`,children:`✗ Bad`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`empty を `,(0,u.jsx)(t.code,{children:`null`}),` 返却で済ます (ユーザーが「読み込み中なのか空なのか」分からない)`]}),`
`,(0,u.jsx)(t.li,{children:`error を console.error で握り潰す (画面上は loading のまま固まる)`}),`
`,(0,u.jsx)(t.li,{children:`spinner を 0.5 秒未満の処理に出す (チラつきの原因)`}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`5-関連`,children:`5. 関連`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`実装: `,(0,u.jsx)(t.code,{children:`src/components/ui/empty-state.tsx`}),`, `,(0,u.jsx)(t.code,{children:`error-state.tsx`}),`, `,(0,u.jsx)(t.code,{children:`loading-state.tsx`})]}),`
`,(0,u.jsxs)(t.li,{children:[`Stories: `,(0,u.jsx)(t.code,{children:`UI/EmptyState`}),`, `,(0,u.jsx)(t.code,{children:`UI/ErrorState`}),`, `,(0,u.jsx)(t.code,{children:`UI/LoadingState`})]}),`
`,(0,u.jsxs)(t.li,{children:[`既存パターン: `,(0,u.jsx)(t.code,{children:`EventCardSkeleton`}),`, `,(0,u.jsx)(t.code,{children:`EventListRowSkeleton`}),`, `,(0,u.jsx)(t.code,{children:`GroupCardSkeleton`}),` (リスト用)`]}),`
`]})]})}function l(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,u.jsx)(t,{...e,children:(0,u.jsx)(c,{...e})}):c(e)}var u;e((()=>{u=t(),s(),i()}))();export{l as default};