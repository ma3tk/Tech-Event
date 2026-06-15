import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{Gt as a,Jt as o,Kt as s,Ut as c,Wt as l,Xt as u,Yt as d,Zt as f,qt as p}from"./iframe-dYpfwGDq.js";var m=e({Basic:()=>_,EventLike:()=>v,HeaderOnly:()=>y,__namedExportsOrder:()=>b,default:()=>g}),h,g,_,v,y,b,x=t((()=>{h=n(),d(),r(),f(),g={title:`UI/Card`,parameters:{layout:`centered`,docs:{description:{component:["**設計意図**: 5 つのスロット (`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`) に分割し、レイアウトを Composition で組み立てる shadcn パターン。",``,"- ベースは `bg-surface` + `border-border` + `rounded-card` + `shadow-elevation-card`。Light/Dark テーマで自動切替","- ListRow など 1 行レイアウトには使わず、`<div>` で組む (= Card は「カード」という視覚メタファに特化)","- ホバー時にカード全体をクリック可能にする場合は親で `<Link>` をラップする。Card 自体に onClick を付けない",``,`**Anti-pattern**:`,"- ❌ Card 内に `position: fixed` の sticky を入れる (= 親の `overflow: hidden` で見切れる)","- ❌ `bg-white` をハードコード (= ダークモードで白カードのまま残る)","- ❌ CardHeader / CardTitle を省略して `<h3>` を直書きする (= タイポグラフィスケールが揃わない)",``,`**カタログ**: [docs/catalog/01-atoms/card.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/card.md) — 使い分けガイド`].join(`
`)}}}},_={render:()=>(0,h.jsxs)(c,{className:`w-80`,children:[(0,h.jsxs)(p,{children:[(0,h.jsx)(o,{children:`カードのタイトル`}),(0,h.jsx)(a,{children:`カードの説明文がここに入ります。`})]}),(0,h.jsx)(l,{children:(0,h.jsx)(`p`,{className:`text-sm text-foreground`,children:`本文。一覧表示・詳細表示の汎用コンテナです。`})}),(0,h.jsxs)(s,{children:[(0,h.jsx)(i,{size:`sm`,children:`アクション`}),(0,h.jsx)(i,{size:`sm`,variant:`outline`,children:`キャンセル`})]})]})},v={render:()=>(0,h.jsxs)(c,{className:`w-96`,children:[(0,h.jsxs)(p,{children:[(0,h.jsxs)(`div`,{className:`flex items-start justify-between gap-3`,children:[(0,h.jsx)(o,{children:`Next.js 16 リリース勉強会`}),(0,h.jsx)(u,{variant:`success`,children:`募集中`})]}),(0,h.jsx)(a,{children:`2026年06月15日 (月) 19:00 - 21:00`})]}),(0,h.jsx)(l,{children:(0,h.jsx)(`p`,{className:`text-sm leading-relaxed`,children:`Next.js 16 の新機能と React 19 を組み合わせた最新パターンを学びます。`})}),(0,h.jsxs)(s,{className:`justify-between`,children:[(0,h.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:`42 / 60 人`}),(0,h.jsx)(i,{size:`sm`,children:`参加する`})]})]})},y={render:()=>(0,h.jsx)(c,{className:`w-80`,children:(0,h.jsxs)(p,{children:[(0,h.jsx)(o,{children:`シンプルカード`}),(0,h.jsx)(a,{children:`本文無しでも成立します。`})]})})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle>カードのタイトル</CardTitle>
        <CardDescription>カードの説明文がここに入ります。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          本文。一覧表示・詳細表示の汎用コンテナです。
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">アクション</Button>
        <Button size="sm" variant="outline">
          キャンセル
        </Button>
      </CardFooter>
    </Card>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-96">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Next.js 16 リリース勉強会</CardTitle>
          <Badge variant="success">募集中</Badge>
        </div>
        <CardDescription>2026年06月15日 (月) 19:00 - 21:00</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">
          Next.js 16 の新機能と React 19 を組み合わせた最新パターンを学びます。
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">42 / 60 人</span>
        <Button size="sm">参加する</Button>
      </CardFooter>
    </Card>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <Card className="w-80">
      <CardHeader>
        <CardTitle>シンプルカード</CardTitle>
        <CardDescription>本文無しでも成立します。</CardDescription>
      </CardHeader>
    </Card>
}`,...y.parameters?.docs?.source}}},b=[`Basic`,`EventLike`,`HeaderOnly`]}));x();export{_ as Basic,v as EventLike,y as HeaderOnly,b as __namedExportsOrder,g as default,x as n,m as t};