import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Fallback as f,Sizes as p,WithImage as m,n as h,t as g}from"./avatar.stories-CsgzYoLB.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`ユーザー / グループの `,(0,y.jsx)(t.strong,{children:`アバター画像`}),` を表示。画像読み込み失敗時は `,(0,y.jsx)(t.strong,{children:`イニシャル`}),` にフォールバック。Radix UI ベース。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/avatar.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`ユーザー / グループの `,(0,y.jsx)(t.strong,{children:`アバター画像`}),` を表示。画像読み込み失敗時は `,(0,y.jsx)(t.strong,{children:`イニシャル`}),` にフォールバック。Radix UI ベース。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`ユーザーアイコン (ヘッダー / コメント / 参加者リスト)`}),`
`,(0,y.jsx)(t.li,{children:`グループのロゴ`}),`
`,(0,y.jsx)(t.li,{children:`主催者表示`}),`
`,(0,y.jsxs)(t.li,{children:[`アバターと名前のセット (`,(0,y.jsx)(t.a,{href:`../components/participant-badge.md`,children:`ParticipantBadge`}),`)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`画像のみの装飾 → `,(0,y.jsx)(t.code,{children:`<Image>`}),` を直接`]}),`
`,(0,y.jsx)(t.li,{children:`ロゴ単独 → 別コンポーネント (テキストロゴ)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`○ ← 画像 or イニシャル fallback (例: "JS")
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント--サイズ`,children:`5. バリアント / サイズ`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`サイズ`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`px`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`sm`}),(0,y.jsx)(t.td,{children:`リスト行 / コメント`}),(0,y.jsx)(t.td,{children:`24`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`md`}),(0,y.jsx)(t.td,{children:`標準`}),(0,y.jsx)(t.td,{children:`32`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`lg`}),(0,y.jsx)(t.td,{children:`ヘッダー / プロフィール`}),(0,y.jsx)(t.td,{children:`48`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`xl`}),(0,y.jsx)(t.td,{children:`プロフィールヘッダー`}),(0,y.jsx)(t.td,{children:`64+`})]})]})]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsx)(t.p,{children:`loading (画像読み込み中) / loaded / fallback (失敗)。`}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`alt`}),` で意味を持つ画像は記述 (主催者「山田太郎のアバター」等)`]}),`
`,(0,y.jsxs)(t.li,{children:[`イニシャルフォールバックは装飾扱い (`,(0,y.jsx)(t.code,{children:`aria-hidden`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`周辺テキストで意味を担保`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";

<Avatar className="size-8">
  <AvatarImage src={user.image} alt={\`\${user.name} のアバター\`} />
  <AvatarFallback aria-hidden>
    {user.name.slice(0, 2)}
  </AvatarFallback>
</Avatar>
`})}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ alt 抜け → ✅ 意味があるなら必須`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ 角丸を `,(0,y.jsx)(t.code,{children:`rounded-md`}),` 等で → ✅ `,(0,y.jsx)(t.code,{children:`rounded-full`}),` 厳守`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/participant-badge.md`,children:`ParticipantBadge`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/host-avatar-stack.md`,children:`HostAvatarStack`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};