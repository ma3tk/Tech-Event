import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{$t as a,Qt as o,a as s,en as c,n as l,r as u,t as d}from"./iframe-Dl0jzNl2.js";import{n as f,t as p}from"./link-Du4AGLbo.js";function m(e){let t=0;for(let n of e)t=(t+n.charCodeAt(0))%360;return t}function h(e){return e.length===0?``:e.length===1?e[0].name:e.length===2?`${e[0].name}, ${e[1].name}`:`${e.slice(0,2).map(e=>e.name).join(`, `)} ほか ${e.length-2} 名`}function g(e){return e.length===0?`主催者なし`:`主催: ${e.map(e=>e.name).join(`, `)}`}function _({hosts:e,maxVisible:t=5,size:n=`md`,label:i,showNames:a=!1,className:o}){if(e.length===0)return null;let s=e.slice(0,t),c=Math.max(0,e.length-s.length),l=b[n];return(0,y.jsxs)(`div`,{role:`group`,"aria-label":g(e),"data-testid":`host-avatar-stack`,className:r(`flex items-center gap-3`,o),children:[i&&(0,y.jsx)(`span`,{className:`text-xs font-semibold uppercase tracking-wide text-muted-foreground`,children:i}),(0,y.jsxs)(`ul`,{className:`flex items-center`,children:[s.map((e,t)=>(0,y.jsx)(`li`,{className:r(t>0&&`-ml-2`),children:(0,y.jsx)(v,{host:e,sizeClass:l})},`${e.name}-${t}`)),c>0&&(0,y.jsx)(`li`,{className:r(s.length>0&&`-ml-2`),children:(0,y.jsxs)(`span`,{"aria-hidden":`true`,"data-testid":`host-avatar-overflow`,className:r(l,`inline-flex items-center justify-center rounded-full bg-border-strong font-semibold text-foreground ring-2 ring-surface`),children:[`+`,c]})})]}),a&&(0,y.jsxs)(`p`,{className:`text-sm text-foreground`,children:[(0,y.jsx)(`span`,{className:`text-muted-foreground`,children:`主催: `}),(0,y.jsx)(`span`,{className:`font-semibold`,children:h(e)})]})]})}function v({host:e,sizeClass:t}){let n=e.role?`${e.name} (${e.role})`:e.name,i=(0,y.jsxs)(o,{className:r(t,`ring-2 ring-surface shadow-soft-md`),children:[e.avatarUrl?(0,y.jsx)(c,{src:e.avatarUrl,alt:e.name}):null,(0,y.jsx)(a,{className:`font-semibold text-white`,style:{backgroundColor:`hsl(${m(e.name)} 65% 50%)`},children:e.name.slice(0,1)})]});return(0,y.jsxs)(l,{children:[(0,y.jsx)(s,{asChild:!0,children:e.profileUrl?(0,y.jsx)(f,{href:e.profileUrl,title:n,"aria-label":n,className:`inline-block transition-transform duration-fast ease-spring hover:z-10 hover:scale-[1.15] focus:z-10 focus:scale-[1.15] focus:outline-none`,children:i}):(0,y.jsx)(`span`,{title:n,"aria-label":n,role:`img`,className:`inline-block transition-transform duration-fast ease-spring hover:scale-[1.1]`,children:i})}),(0,y.jsx)(u,{children:n})]})}var y,b,x=t((()=>{y=n(),p(),i(),d(),b={sm:`h-7 w-7 text-[10px]`,md:`h-9 w-9 text-xs`,lg:`h-12 w-12 text-sm`},_.__docgenInfo={description:`HostAvatarStack 本体。

描画される DOM 構造:
  <div role="group" aria-label="主催: ...">
    <ul class="flex"> -- 視覚的にも順序付きの集合
      <li><a>...avatar</a></li> ...
      <li>+N</li>
    </ul>
    [showNames] <p>主催 by ...</p>
  </div>`,methods:[],displayName:`HostAvatarStack`,props:{hosts:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  /** 表示名 */
  name: string;
  /** アバター画像 URL (未指定なら頭文字フォールバック) */
  avatarUrl?: string | null;
  /** プロフィール URL。指定すると \`<Link>\` で囲む */
  profileUrl?: string;
  /** 主催者/共催者などの肩書き (省略可)。aria-label の文に混ぜない補助テキスト */
  role?: string;
}`,signature:{properties:[{key:`name`,value:{name:`string`,required:!0},description:`表示名`},{key:`avatarUrl`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1},description:`アバター画像 URL (未指定なら頭文字フォールバック)`},{key:`profileUrl`,value:{name:`string`,required:!1},description:"プロフィール URL。指定すると `<Link>` で囲む"},{key:`role`,value:{name:`string`,required:!1},description:`主催者/共催者などの肩書き (省略可)。aria-label の文に混ぜない補助テキスト`}]}}],raw:`HostAvatarHost[]`},description:``},maxVisible:{required:!1,tsType:{name:`number`},description:`一覧で表示する最大人数。これを超えた分は "+N" にまとめる (デフォルト 5)`,defaultValue:{value:`5`,computed:!1}},size:{required:!1,tsType:{name:`union`,raw:`"sm" | "md" | "lg"`,elements:[{name:`literal`,value:`"sm"`},{name:`literal`,value:`"md"`},{name:`literal`,value:`"lg"`}]},description:`サイズ (sm=28px / md=36px / lg=48px)`,defaultValue:{value:`"md"`,computed:!1}},label:{required:!1,tsType:{name:`string`},description:`"主催: ..." のような前置きラベル。指定時はアイコン横に表示`},showNames:{required:!1,tsType:{name:`boolean`},description:`横に氏名サマリを並べる (例: "山田 太郎 ほか 2 名")`,defaultValue:{value:`false`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:``}}}})),S=e({Large:()=>A,NoAvatar:()=>O,Overflow:()=>D,Pair:()=>T,Small:()=>k,Trio:()=>E,__namedExportsOrder:()=>j,default:()=>C}),C,w,T,E,D,O,k,A,j,M=t((()=>{x(),C={title:`Components/HostAvatarStack`,component:_,parameters:{layout:`padded`},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},showNames:{control:`boolean`},maxVisible:{control:{type:`number`,min:1,max:8}}}},w=[{name:`山田 太郎`,avatarUrl:`https://i.pravatar.cc/96?img=12`,profileUrl:`/user/taro`,role:`主催`},{name:`佐藤 花子`,avatarUrl:`https://i.pravatar.cc/96?img=22`,profileUrl:`/user/hanako`,role:`共催`},{name:`Suzuki Jiro`,avatarUrl:`https://i.pravatar.cc/96?img=33`,profileUrl:`/user/jiro`,role:`共催`}],T={args:{hosts:w.slice(0,2),size:`md`,showNames:!0}},E={args:{hosts:w,size:`md`,showNames:!0}},D={args:{hosts:[...w,{name:`Alice`,avatarUrl:`https://i.pravatar.cc/96?img=41`},{name:`Bob`,avatarUrl:`https://i.pravatar.cc/96?img=52`},{name:`Carol`,avatarUrl:`https://i.pravatar.cc/96?img=63`},{name:`Dave`,avatarUrl:`https://i.pravatar.cc/96?img=14`}],size:`md`,maxVisible:5,showNames:!0}},O={args:{hosts:[{name:`山田 太郎`},{name:`佐藤 花子`},{name:`Suzuki`}],size:`md`,showNames:!0}},k={args:{hosts:w,size:`sm`}},A={args:{hosts:w,size:`lg`,showNames:!0,label:`HOSTS`}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: sample.slice(0, 2),
    size: "md",
    showNames: true
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: sample,
    size: "md",
    showNames: true
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: [...sample, {
      name: "Alice",
      avatarUrl: "https://i.pravatar.cc/96?img=41"
    }, {
      name: "Bob",
      avatarUrl: "https://i.pravatar.cc/96?img=52"
    }, {
      name: "Carol",
      avatarUrl: "https://i.pravatar.cc/96?img=63"
    }, {
      name: "Dave",
      avatarUrl: "https://i.pravatar.cc/96?img=14"
    }],
    size: "md",
    maxVisible: 5,
    showNames: true
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: [{
      name: "山田 太郎"
    }, {
      name: "佐藤 花子"
    }, {
      name: "Suzuki"
    }],
    size: "md",
    showNames: true
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: sample,
    size: "sm"
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    hosts: sample,
    size: "lg",
    showNames: true,
    label: "HOSTS"
  }
}`,...A.parameters?.docs?.source}}},j=[`Pair`,`Trio`,`Overflow`,`NoAvatar`,`Small`,`Large`]}));M();export{A as Large,O as NoAvatar,D as Overflow,T as Pair,k as Small,E as Trio,j as __namedExportsOrder,C as default,M as n,S as t};