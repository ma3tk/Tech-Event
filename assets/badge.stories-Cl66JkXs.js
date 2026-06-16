import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{Xt as r,Zt as i}from"./iframe-Dl0jzNl2.js";var a=e({AllVariants:()=>h,Default:()=>c,Destructive:()=>u,Info:()=>m,Outline:()=>d,Secondary:()=>l,Success:()=>f,Warning:()=>p,__namedExportsOrder:()=>g,default:()=>s}),o,s,c,l,u,d,f,p,m,h,g,_=t((()=>{o=n(),i(),s={title:`UI/Badge`,component:r,parameters:{layout:`centered`,docs:{description:{component:["**設計意図**: 状態を 1〜2 単語で表す短いラベル。`success` = open、`warning` = waitlist、`info` = upcoming のように semantic な色を採用。WCAG AA (4.5:1) のコントラスト比は `status-*-fg/bg` で担保。",``,"- イベントステータス (open/full/…) は `EventStatusBadge` (composite) を使う。Badge は更に汎用的な「タグ」用途","- `outline` variant は背景が透明なので、白以外の背景の上に置けば自動で透ける","- アイコン付きは `gap-1` で間隔調整済み — `<Badge><Icon /> 文字</Badge>` でそのまま使える",``,`**Anti-pattern**:`,"- ❌ Badge をクリック可能にする (= ClickableTag / Button を使う。a11y で `<span>` を `role=button` 化するのは avoid)","- ❌ `variant=success` を「完了したタスク」に使う (= 緑は「進行中=募集中」の意味で予約済)","- ❌ Badge 内に長文を入れる (= Badge は最大 12〜16 文字を想定。それ以上は `Tooltip` か `<p>` を使う)",``,`**カタログ**: [docs/catalog/01-atoms/badge.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/badge.md) — 使い分けガイド`].join(`
`)}}},argTypes:{variant:{control:`inline-radio`,options:[`default`,`secondary`,`destructive`,`outline`,`success`,`warning`,`info`]}},args:{children:`Badge`}},c={args:{}},l={args:{variant:`secondary`,children:`Secondary`}},u={args:{variant:`destructive`,children:`Cancelled`}},d={args:{variant:`outline`,children:`Outline`}},f={args:{variant:`success`,children:`募集中`}},p={args:{variant:`warning`,children:`補欠`}},m={args:{variant:`info`,children:`Upcoming`}},h={render:()=>(0,o.jsxs)(`div`,{className:`flex flex-wrap gap-2 bg-surface p-4`,children:[(0,o.jsx)(r,{children:`Default`}),(0,o.jsx)(r,{variant:`secondary`,children:`Secondary`}),(0,o.jsx)(r,{variant:`destructive`,children:`Destructive`}),(0,o.jsx)(r,{variant:`outline`,children:`Outline`}),(0,o.jsx)(r,{variant:`success`,children:`Success`}),(0,o.jsx)(r,{variant:`warning`,children:`Warning`}),(0,o.jsx)(r,{variant:`info`,children:`Info`})]})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "Secondary"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "destructive",
    children: "Cancelled"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline",
    children: "Outline"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    children: "募集中"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "warning",
    children: "補欠"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "info",
    children: "Upcoming"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2 bg-surface p-4">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Secondary`,`Destructive`,`Outline`,`Success`,`Warning`,`Info`,`AllVariants`]}));_();export{h as AllVariants,c as Default,u as Destructive,m as Info,d as Outline,l as Secondary,f as Success,p as Warning,g as __namedExportsOrder,s as default,_ as n,a as t};