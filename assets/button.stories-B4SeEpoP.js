import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{I as a,K as o,t as s,v as c}from"./lucide-react-Dj6IqqEq.js";var l=e({AllSizes:()=>y,AllVariants:()=>v,AsChildLink:()=>w,Default:()=>f,Destructive:()=>m,Disabled:()=>S,Ghost:()=>g,Link:()=>_,Loading:()=>C,LumaSize:()=>b,Outline:()=>h,Secondary:()=>p,WithIcon:()=>x,__namedExportsOrder:()=>T,default:()=>d}),u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E=t((()=>{u=n(),s(),r(),d={title:`UI/Button`,component:i,parameters:{layout:`centered`,docs:{description:{component:["**設計意図**: CVA で variant × size を直交させ、`asChild` で `<Link>` / `<a>` に被せて使う shadcn パターン。",``,"- `variant=default` はブランドオレンジ (`bg-brand-orange`)、`destructive` はキャンセル系 (`bg-brand-red`)、`outline` / `ghost` は背景なし。","- `size=icon` は正方形 (h-10 w-10)。必ず `aria-label` を付与すること。","- フォーカスリングはグローバル `:focus-visible` + 明示的 `focus-visible:ring-2` の二重実装で、Tailwind ユーティリティの prune に強い。","- Motion: `duration-fast` (150ms) で hover/focus を素早く返す。",``,`**Anti-pattern**:`,"- ❌ `<a>` を直接 className でスタイルする (= `asChild` を使う)","- ❌ `variant=destructive` を成功系の CTA に使う (色の意味の濫用)","- ❌ `size=icon` で `aria-label` を省略する (SR ユーザーが何のボタンか分からない)",``,`**カタログ**: [docs/catalog/01-atoms/button.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/button.md) — 使い分けガイド (いつ使う / いつ使わない / アンチパターン)`].join(`
`)}}},argTypes:{variant:{control:`inline-radio`,options:[`default`,`secondary`,`destructive`,`outline`,`ghost`,`link`]},size:{control:`inline-radio`,options:[`xs`,`sm`,`md`,`lg`,`icon`,`luma`]},disabled:{control:`boolean`},asChild:{control:`boolean`}},args:{children:`ボタン`}},f={args:{}},p={args:{variant:`secondary`}},m={args:{variant:`destructive`,children:`削除する`}},h={args:{variant:`outline`}},g={args:{variant:`ghost`}},_={args:{variant:`link`,children:`詳細を見る`}},v={render:()=>(0,u.jsxs)(`div`,{className:`flex flex-wrap gap-3 bg-surface p-4`,children:[(0,u.jsx)(i,{children:`Default`}),(0,u.jsx)(i,{variant:`secondary`,children:`Secondary`}),(0,u.jsx)(i,{variant:`destructive`,children:`Destructive`}),(0,u.jsx)(i,{variant:`outline`,children:`Outline`}),(0,u.jsx)(i,{variant:`ghost`,children:`Ghost`}),(0,u.jsx)(i,{variant:`link`,children:`Link`})]})},y={render:()=>(0,u.jsxs)(`div`,{className:`flex flex-wrap items-end gap-3 bg-surface p-4`,children:[(0,u.jsx)(i,{size:`xs`,children:`XS`}),(0,u.jsx)(i,{size:`sm`,children:`Small`}),(0,u.jsx)(i,{size:`md`,children:`Medium`}),(0,u.jsx)(i,{size:`lg`,children:`Large`}),(0,u.jsx)(i,{size:`icon`,"aria-label":`検索`,children:(0,u.jsx)(a,{})}),(0,u.jsx)(i,{size:`luma`,children:`Luma 風 CTA`})]})},b={args:{size:`luma`,children:`参加申込`}},x={render:()=>(0,u.jsxs)(`div`,{className:`flex flex-wrap gap-3 bg-surface p-4`,children:[(0,u.jsxs)(i,{children:[(0,u.jsx)(o,{}),` イベントを作成`]}),(0,u.jsxs)(i,{variant:`destructive`,children:[(0,u.jsx)(c,{}),` 削除`]}),(0,u.jsxs)(i,{variant:`outline`,children:[(0,u.jsx)(a,{}),` 検索`]})]})},S={args:{disabled:!0,children:`使えません`}},C={render:()=>(0,u.jsxs)(i,{disabled:!0,children:[(0,u.jsx)(`span`,{className:`inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent`}),`送信中...`]})},w={render:()=>(0,u.jsx)(i,{asChild:!0,children:(0,u.jsx)(`a`,{href:`#example`,children:`a 要素として描画`})})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "destructive",
    children: "削除する"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "ghost"
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "link",
    children: "詳細を見る"
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3 bg-surface p-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap items-end gap-3 bg-surface p-4">
      <Button size="xs">XS</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="検索">
        <Search />
      </Button>
      <Button size="luma">Luma 風 CTA</Button>
    </div>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    size: "luma",
    children: "参加申込"
  }
}`,...b.parameters?.docs?.source},description:{story:`Luma 風 サイズ — rounded-2xl + shadow-soft-md + font-semibold。
主要 CTA (申込ボックス / Discover バナー) で利用。`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-3 bg-surface p-4">
      <Button>
        <Plus /> イベントを作成
      </Button>
      <Button variant="destructive">
        <Trash2 /> 削除
      </Button>
      <Button variant="outline">
        <Search /> 検索
      </Button>
    </div>
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: "使えません"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <Button disabled>
      <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      送信中...
    </Button>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <Button asChild>
      <a href="#example">a 要素として描画</a>
    </Button>
}`,...w.parameters?.docs?.source}}},T=[`Default`,`Secondary`,`Destructive`,`Outline`,`Ghost`,`Link`,`AllVariants`,`AllSizes`,`LumaSize`,`WithIcon`,`Disabled`,`Loading`,`AsChildLink`]}));E();export{y as AllSizes,v as AllVariants,w as AsChildLink,f as Default,m as Destructive,S as Disabled,g as Ghost,_ as Link,C as Loading,b as LumaSize,h as Outline,p as Secondary,x as WithIcon,T as __namedExportsOrder,d as default,E as n,l as t};