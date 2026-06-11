import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{t as a}from"./button-Cb4kPHxL.js";import{fn as o,t as s,un as c}from"./lucide-react-Dj6IqqEq.js";import{t as l}from"./iframe-O2Td0HUc.js";import{n as u,t as d}from"./link-Du4AGLbo.js";function f(e,t,n=1,r=1){let i=[],a=Math.max(e-n,r+1),o=Math.min(e+n,t-r);for(let e=1;e<=Math.min(r,t);e++)i.push(e);a>r+1&&i.push(`ellipsis`);for(let e=a;e<=o;e++)e>r&&e<=t-r&&i.push(e);o<t-r&&i.push(`ellipsis`);for(let e=Math.max(t-r+1,r+1);e<=t;e++)i.push(e);return i}function p({currentPage:e,totalPages:t,siblingCount:n=1,boundaryCount:i=1,buildHref:a,baseUrl:s,ariaLabel:l=`ページネーション`,className:u}){if(t<=1)return null;let d=e=>a?a(e):s?h(s,e):`?page=${e}`,p=f(e,t,n,i),_=e<=1,v=e>=t;return(0,g.jsx)(`nav`,{"aria-label":l,className:r(`flex justify-center py-6`,u),children:(0,g.jsxs)(`ul`,{className:`flex items-center gap-1`,children:[(0,g.jsx)(`li`,{children:(0,g.jsxs)(m,{href:d(e-1),disabled:_,ariaLabel:`前のページに移動`,children:[(0,g.jsx)(o,{"aria-hidden":`true`,className:`h-4 w-4 rtl-flip`}),(0,g.jsx)(`span`,{className:`hidden sm:inline ms-1`,children:`前へ`})]})}),p.map((t,n)=>t===`ellipsis`?(0,g.jsx)(`li`,{"aria-hidden":`true`,className:`px-2 text-muted select-none`,children:`…`},`e-${n}`):(0,g.jsx)(`li`,{className:`hidden sm:list-item`,children:(0,g.jsx)(m,{href:d(t),isCurrent:t===e,ariaLabel:t===e?`現在のページ、${t}ページ目`:`${t}ページ目に移動`,children:t})},t)),(0,g.jsxs)(`li`,{className:`sm:hidden px-3 text-sm text-muted-foreground`,children:[(0,g.jsx)(`span`,{role:`link`,"aria-current":`page`,"aria-label":`現在のページ、${e} / ${t}`,className:`font-semibold text-foreground`,children:e}),` `,`/ `,t]}),(0,g.jsx)(`li`,{children:(0,g.jsxs)(m,{href:d(e+1),disabled:v,ariaLabel:`次のページに移動`,children:[(0,g.jsx)(`span`,{className:`hidden sm:inline me-1`,children:`次へ`}),(0,g.jsx)(c,{"aria-hidden":`true`,className:`h-4 w-4 rtl-flip`})]})})]})})}function m({href:e,disabled:t,isCurrent:n,ariaLabel:i,children:o}){let s=`inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors`;return t?(0,g.jsx)(`span`,{role:`link`,"aria-disabled":`true`,"aria-label":i,className:r(s,`border-border bg-surface text-muted opacity-50 cursor-not-allowed`),children:o}):n?(0,g.jsx)(`span`,{role:`link`,"aria-current":`page`,"aria-label":i,className:r(s,`border-brand-orange bg-brand-orange text-white cursor-default pointer-events-none`),children:o}):(0,g.jsx)(a,{asChild:!0,variant:`outline`,size:`sm`,className:r(s,`border-border bg-surface text-foreground hover:border-brand-orange hover:text-brand-orange hover:bg-surface`),children:(0,g.jsx)(u,{href:e,"aria-label":i,children:o})})}function h(e,t){let[n,r=``]=e.split(`?`),i=new URLSearchParams(r);i.set(`page`,String(t));let a=i.toString();return a?`${n}?${a}`:n}var g,_=t((()=>{g=n(),d(),s(),i(),l(),p.__docgenInfo={description:'数値ベースのページネーション。\n\n- `baseUrl` を渡すと `?page=N` を自動付与\n- `buildHref` を渡すと URL 組み立てを完全に上書き\n- `totalPages <= 1` なら何も描画しない (`null`)\n\n内部の前へ/次へボタン、ページ番号ボタンは `ui/Button` の `asChild` パターンで\n`<Link>` を直接スタイルする。disabled / current ページは `<span>` で\n`role="link"` を付与し、aria-disabled / aria-current で状態を伝える。',methods:[],displayName:`Pagination`,props:{currentPage:{required:!0,tsType:{name:`number`},description:``},totalPages:{required:!0,tsType:{name:`number`},description:``},siblingCount:{required:!1,tsType:{name:`number`},description:`現在ページの前後に表示するページ数`,defaultValue:{value:`1`,computed:!1}},boundaryCount:{required:!1,tsType:{name:`number`},description:`先頭/末尾に表示するページ数`,defaultValue:{value:`1`,computed:!1}},buildHref:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(page: number) => string`,signature:{arguments:[{type:{name:`number`},name:`page`}],return:{name:`string`}}},description:"ページ番号からリンク URL を組み立てる関数。\n`baseUrl` から自動生成する場合は省略可。"},baseUrl:{required:!1,tsType:{name:`string`},description:"ベース URL (クエリパラメータを含む)。`?page=N` を組み立てる際に利用。\n例: `/explore?keyword=react` → `/explore?keyword=react&page=2`"},ariaLabel:{required:!1,tsType:{name:`string`},description:"`<nav aria-label>` の上書き",defaultValue:{value:`"ページネーション"`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:``}}}})),v=e({BoundaryCount2:()=>k,CustomBuildHref:()=>E,Default:()=>b,FirstPage:()=>x,LastPage:()=>S,ManyPages:()=>C,NoEllipsis:()=>w,SiblingCount0:()=>D,SiblingCount2:()=>O,SinglePage:()=>T,__namedExportsOrder:()=>A,default:()=>y}),y,b,x,S,C,w,T,E,D,O,k,A,j=t((()=>{_(),y={title:`Components/Pagination`,component:p,parameters:{layout:`padded`},argTypes:{currentPage:{control:{type:`number`,min:1}},totalPages:{control:{type:`number`,min:1}},siblingCount:{control:{type:`number`,min:0}},boundaryCount:{control:{type:`number`,min:0}}}},b={args:{currentPage:3,totalPages:10,baseUrl:`/explore`}},x={args:{currentPage:1,totalPages:10,baseUrl:`/explore`}},S={args:{currentPage:10,totalPages:10,baseUrl:`/explore`}},C={args:{currentPage:25,totalPages:100,baseUrl:`/explore`}},w={args:{currentPage:2,totalPages:5,baseUrl:`/explore`}},T={args:{currentPage:1,totalPages:1,baseUrl:`/explore`},parameters:{docs:{description:{story:`totalPages が 1 以下のときは何も描画されない (null を返す)。`}}}},E={args:{currentPage:4,totalPages:12,buildHref:e=>`#page-${e}`}},D={args:{currentPage:5,totalPages:20,siblingCount:0,baseUrl:`/explore`},parameters:{docs:{description:{story:`siblingCount=0 では現在ページの周辺ページが表示されず、端点と現在ページだけになる (ellipsis で省略)。`}}}},O={args:{currentPage:10,totalPages:20,siblingCount:2,baseUrl:`/explore`},parameters:{docs:{description:{story:`siblingCount=2 では現在ページの前後 2 ページずつを表示する (例: 8 9 [10] 11 12)。`}}}},k={args:{currentPage:10,totalPages:20,boundaryCount:2,baseUrl:`/explore`}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 3,
    totalPages: 10,
    baseUrl: "/explore"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 1,
    totalPages: 10,
    baseUrl: "/explore"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 10,
    totalPages: 10,
    baseUrl: "/explore"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 25,
    totalPages: 100,
    baseUrl: "/explore"
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 2,
    totalPages: 5,
    baseUrl: "/explore"
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 1,
    totalPages: 1,
    baseUrl: "/explore"
  },
  parameters: {
    docs: {
      description: {
        story: "totalPages が 1 以下のときは何も描画されない (null を返す)。"
      }
    }
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 4,
    totalPages: 12,
    buildHref: p => \`#page-\${p}\`
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 5,
    totalPages: 20,
    siblingCount: 0,
    baseUrl: "/explore"
  },
  parameters: {
    docs: {
      description: {
        story: "siblingCount=0 では現在ページの周辺ページが表示されず、端点と現在ページだけになる (ellipsis で省略)。"
      }
    }
  }
}`,...D.parameters?.docs?.source},description:{story:`siblingCount=0: 現在ページの前後ボタンを表示しない (端点 + 現在のみ)。
カバレッジ表の "Pagination siblingCount カスタム 100%" の根拠ストーリー。`,...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 10,
    totalPages: 20,
    siblingCount: 2,
    baseUrl: "/explore"
  },
  parameters: {
    docs: {
      description: {
        story: "siblingCount=2 では現在ページの前後 2 ページずつを表示する (例: 8 9 [10] 11 12)。"
      }
    }
  }
}`,...O.parameters?.docs?.source},description:{story:`siblingCount=2: 現在ページの前後 2 ページずつを表示。`,...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    currentPage: 10,
    totalPages: 20,
    boundaryCount: 2,
    baseUrl: "/explore"
  }
}`,...k.parameters?.docs?.source},description:{story:`boundaryCount=2: 先頭・末尾の表示ページ数を多めに。`,...k.parameters?.docs?.description}}},A=[`Default`,`FirstPage`,`LastPage`,`ManyPages`,`NoEllipsis`,`SinglePage`,`CustomBuildHref`,`SiblingCount0`,`SiblingCount2`,`BoundaryCount2`]}));j();export{k as BoundaryCount2,E as CustomBuildHref,b as Default,x as FirstPage,S as LastPage,C as ManyPages,w as NoEllipsis,D as SiblingCount0,O as SiblingCount2,T as SinglePage,A as __namedExportsOrder,y as default,j as n,v as t};