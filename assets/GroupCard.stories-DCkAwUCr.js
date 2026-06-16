import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{t as a}from"./button-Cb4kPHxL.js";import{bn as o,o as s,t as c}from"./lucide-react-Dj6IqqEq.js";import{$t as l,Qt as u,Ut as d,en as f,t as p}from"./iframe-Dl0jzNl2.js";import{n as m,t as h}from"./link-Du4AGLbo.js";function g({group:e,variant:t=`standard`,href:n,isJoined:i=!1,onJoinToggle:c,className:l}){let u=n??e.url??(e.subdomain?`/group/${e.subdomain}`:`/group/${e.id}`),f=`grp-${e.id}-name`,p=e.logoUrl??e.thumbnailUrl??e.coverImageUrl??null;return t===`sidebar`||t===`compact`?(0,v.jsxs)(d,{role:`article`,"aria-labelledby":f,className:r(`flex items-center gap-3 rounded-md p-3 transition-shadow hover:shadow-sm`,l),children:[(0,v.jsx)(_,{name:e.name,logoUrl:p,url:u,size:`sm`}),(0,v.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,v.jsx)(`h3`,{id:f,className:`text-sm font-bold text-foreground truncate`,children:(0,v.jsx)(m,{href:u,className:`hover:text-brand-orange hover:underline`,children:e.name})}),(0,v.jsxs)(`p`,{className:`mt-1 flex items-center gap-3 text-xs text-muted-foreground`,children:[(0,v.jsxs)(`span`,{className:`inline-flex items-center gap-1`,children:[(0,v.jsx)(s,{"aria-hidden":`true`,className:`h-3 w-3`}),new Intl.NumberFormat(`ja-JP`).format(e.memberCount),`人`]}),(0,v.jsxs)(`span`,{className:`inline-flex items-center gap-1`,children:[(0,v.jsx)(o,{"aria-hidden":`true`,className:`h-3 w-3`}),new Intl.NumberFormat(`ja-JP`).format(e.eventCount),`回`]})]})]})]}):(0,v.jsxs)(d,{role:`article`,"aria-labelledby":f,className:r(`flex flex-col gap-4 p-5 sm:flex-row`,`transition-all hover:shadow-md hover:-translate-y-0.5`,l),children:[(0,v.jsx)(_,{name:e.name,logoUrl:p,url:u}),(0,v.jsxs)(`div`,{className:`flex flex-1 flex-col gap-2 min-w-0`,children:[(0,v.jsx)(`h3`,{id:f,className:`text-lg font-bold text-foreground hover:text-brand-orange transition-colors`,children:(0,v.jsx)(m,{href:u,className:`hover:underline`,children:e.name})}),e.subtitle&&(0,v.jsx)(`p`,{className:`text-sm text-muted-foreground line-clamp-1`,children:e.subtitle}),e.description&&(0,v.jsx)(`p`,{className:`text-sm text-muted-foreground line-clamp-2`,children:e.description}),(0,v.jsxs)(`dl`,{className:`mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground`,children:[(0,v.jsxs)(`div`,{className:`inline-flex items-center gap-1.5`,children:[(0,v.jsx)(`dt`,{className:`sr-only`,children:`メンバー`}),(0,v.jsx)(s,{"aria-hidden":`true`,className:`h-4 w-4`}),(0,v.jsxs)(`dd`,{"aria-label":`メンバー ${e.memberCount}人`,children:[new Intl.NumberFormat(`ja-JP`).format(e.memberCount),`人`]})]}),(0,v.jsxs)(`div`,{className:`inline-flex items-center gap-1.5`,children:[(0,v.jsx)(`dt`,{className:`sr-only`,children:`開催回数`}),(0,v.jsx)(o,{"aria-hidden":`true`,className:`h-4 w-4`}),(0,v.jsxs)(`dd`,{"aria-label":`開催回数 ${e.eventCount}回`,children:[new Intl.NumberFormat(`ja-JP`).format(e.eventCount),`回開催`]})]})]}),(0,v.jsx)(`div`,{className:`flex justify-end`,children:(0,v.jsx)(a,{type:`button`,"aria-pressed":i,onClick:c,variant:i?`secondary`:`default`,size:`sm`,className:`h-9 px-4 text-sm font-medium`,children:i?`参加中`:`グループに参加`})})]})]})}function _({name:e,logoUrl:t,url:n,size:i=`md`}){let a=(0,v.jsxs)(u,{className:r(`rounded-lg border border-border bg-surface`,i===`sm`?`h-12 w-12`:`h-24 w-24 sm:h-28 sm:w-28`),children:[t?(0,v.jsx)(f,{src:t,alt:``,loading:`lazy`,className:`object-cover`}):null,(0,v.jsx)(l,{className:`rounded-lg bg-brand-orange-soft text-brand-orange font-bold`,children:e.slice(0,1)})]});return n?(0,v.jsx)(m,{href:n,"aria-label":`${e} の詳細`,className:`shrink-0`,children:a}):(0,v.jsx)(`div`,{className:`shrink-0`,children:a})}var v,y=t((()=>{v=n(),h(),c(),i(),p(),g.__docgenInfo={description:"グループ (シリーズ) カード。\n\n- `standard`: ロゴ + 説明 + 統計 + 参加ボタン (一覧用)\n- `sidebar`: ロゴ + 名前 + 統計のみ (サイドバー用)\n\n入力データは `SerializedGroup` 互換 (description が `string | null` でも可)。\n\n内部実装は `ui/Card` (rounded-lg/border/bg-surface/shadow-sm) をベースに、\nロゴは `ui/Avatar`、参加ボタンは `ui/Button` の variant=default/secondary で実装。",methods:[],displayName:`GroupCard`,props:{group:{required:!0,tsType:{name:`intersection`,raw:`Pick<
  SerializedGroup,
  "id" | "name" | "memberCount" | "eventCount"
> & {
  /** サブドメイン (詳細ページの URL 構築に使用)。省略時は href を渡すこと。 */
  subdomain?: string;
  description?: string | null;
  /** ロゴ URL の明示指定。thumbnailUrl/coverImageUrl より優先される。 */
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  subtitle?: string | null;
  /** 詳細ページ URL。指定があれば subdomain より優先 */
  url?: string;
}`,elements:[{name:`Pick`,elements:[{name:`signature`,type:`object`,raw:`{
  [K in keyof T]: T[K] extends bigint
    ? string
    : T[K] extends bigint | null
      ? string | null
      : T[K] extends Date
        ? string
        : T[K] extends Date | null
          ? string | null
          : T[K];
}`,signature:{properties:[{key:{name:`Group`,required:!0},value:{name:`unknown`}}]}},{name:`union`,raw:`"id" | "name" | "memberCount" | "eventCount"`,elements:[{name:`literal`,value:`"id"`},{name:`literal`,value:`"name"`},{name:`literal`,value:`"memberCount"`},{name:`literal`,value:`"eventCount"`}]}],raw:`Pick<
  SerializedGroup,
  "id" | "name" | "memberCount" | "eventCount"
>`},{name:`signature`,type:`object`,raw:`{
  /** サブドメイン (詳細ページの URL 構築に使用)。省略時は href を渡すこと。 */
  subdomain?: string;
  description?: string | null;
  /** ロゴ URL の明示指定。thumbnailUrl/coverImageUrl より優先される。 */
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  subtitle?: string | null;
  /** 詳細ページ URL。指定があれば subdomain より優先 */
  url?: string;
}`,signature:{properties:[{key:`subdomain`,value:{name:`string`,required:!1},description:`サブドメイン (詳細ページの URL 構築に使用)。省略時は href を渡すこと。`},{key:`description`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1}},{key:`logoUrl`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1},description:`ロゴ URL の明示指定。thumbnailUrl/coverImageUrl より優先される。`},{key:`thumbnailUrl`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1}},{key:`coverImageUrl`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1}},{key:`subtitle`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1}},{key:`url`,value:{name:`string`,required:!1},description:`詳細ページ URL。指定があれば subdomain より優先`}]}}]},description:``},variant:{required:!1,tsType:{name:`union`,raw:`"standard" | "sidebar" | "compact"`,elements:[{name:`literal`,value:`"standard"`},{name:`literal`,value:`"sidebar"`},{name:`literal`,value:`"compact"`}]},description:"表示バリアント。\n- `standard`: 一覧用の通常サイズ\n- `sidebar` / `compact`: 省スペース版 (どちらも同じ見た目)",defaultValue:{value:`"standard"`,computed:!1}},href:{required:!1,tsType:{name:`string`},description:"詳細ページ URL。デフォルトは `/group/{subdomain}`"},isJoined:{required:!1,tsType:{name:`boolean`},description:`現在ユーザーが参加済みか (参加ボタンの表示切り替え)`,defaultValue:{value:`false`,computed:!1}},onJoinToggle:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:`参加ボタンの押下ハンドラ`},className:{required:!1,tsType:{name:`string`},description:``}}}})),b=e({Sidebar:()=>O,SidebarList:()=>k,SidebarWithLogo:()=>M,Standard:()=>w,StandardJoined:()=>T,StandardNoDescription:()=>D,StandardNoLogo:()=>E,WithLogo:()=>A,WithLogoJoined:()=>j,__namedExportsOrder:()=>N,default:()=>S}),x,S,C,w,T,E,D,O,k,A,j,M,N,P=t((()=>{x=n(),y(),S={title:`Components/GroupCard`,component:g,parameters:{layout:`padded`},argTypes:{variant:{control:`inline-radio`,options:[`standard`,`sidebar`,`compact`]},isJoined:{control:`boolean`}}},C={id:`g1`,name:`TypeScript JP`,memberCount:8421,eventCount:56,subdomain:`typescript-jp`,description:`TypeScript を学び・楽しむ日本のコミュニティです。月1回の Meetup を中心に、初心者から上級者まで幅広く参加できる勉強会を開催しています。`,subtitle:`TypeScript 好きが集まる勉強会`,logoUrl:`https://placehold.co/200x200/ea5404/ffffff?text=TS`},w={args:{group:C,variant:`standard`}},T={args:{group:C,variant:`standard`,isJoined:!0}},E={args:{group:{...C,logoUrl:null},variant:`standard`}},D={args:{group:{...C,description:null,subtitle:null},variant:`standard`}},O={args:{group:C,variant:`sidebar`},render:e=>(0,x.jsx)(`div`,{className:`w-72`,children:(0,x.jsx)(g,{...e})})},k={render:()=>(0,x.jsx)(`div`,{className:`flex w-72 flex-col gap-2`,children:[{name:`TypeScript JP`,members:8421,events:56},{name:`React Tokyo`,members:12340,events:88},{name:`Next.js Meetup`,members:5421,events:24}].map((e,t)=>(0,x.jsx)(g,{variant:`sidebar`,group:{id:`g${t}`,name:e.name,memberCount:e.members,eventCount:e.events,subdomain:e.name.toLowerCase().replace(/\s/g,`-`),logoUrl:`https://placehold.co/64x64/ea5404/ffffff?text=${e.name[0]}`}},e.name))})},A={args:{group:{...C,logoUrl:`https://picsum.photos/seed/grpcard-logo-1/200/200`},variant:`standard`}},j={args:{group:{...C,logoUrl:`https://picsum.photos/seed/grpcard-logo-2/200/200`},variant:`standard`,isJoined:!0}},M={args:{group:{...C,logoUrl:`https://picsum.photos/seed/grpcard-logo-3/64/64`},variant:`sidebar`},render:e=>(0,x.jsx)(`div`,{className:`w-72`,children:(0,x.jsx)(g,{...e})})},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    group: baseGroup,
    variant: "standard"
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    group: baseGroup,
    variant: "standard",
    isJoined: true
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    group: {
      ...baseGroup,
      logoUrl: null
    },
    variant: "standard"
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    group: {
      ...baseGroup,
      description: null,
      subtitle: null
    },
    variant: "standard"
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    group: baseGroup,
    variant: "sidebar"
  },
  render: args => <div className="w-72">
      <GroupCard {...args} />
    </div>
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex w-72 flex-col gap-2">
      {[{
      name: "TypeScript JP",
      members: 8421,
      events: 56
    }, {
      name: "React Tokyo",
      members: 12340,
      events: 88
    }, {
      name: "Next.js Meetup",
      members: 5421,
      events: 24
    }].map((g, i) => <GroupCard key={g.name} variant="sidebar" group={{
      id: \`g\${i}\`,
      name: g.name,
      memberCount: g.members,
      eventCount: g.events,
      subdomain: g.name.toLowerCase().replace(/\\s/g, "-"),
      logoUrl: \`https://placehold.co/64x64/ea5404/ffffff?text=\${g.name[0]}\`
    }} />)}
    </div>
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-1/200/200"
    },
    variant: "standard"
  }
}`,...A.parameters?.docs?.source},description:{story:`logoUrl ありのケース (Picsum で安定したダミー画像を生成)。
カバレッジ表の "GroupCard logoUrl 100%" の根拠ストーリー。`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-2/200/200"
    },
    variant: "standard",
    isJoined: true
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    group: {
      ...baseGroup,
      logoUrl: "https://picsum.photos/seed/grpcard-logo-3/64/64"
    },
    variant: "sidebar"
  },
  render: args => <div className="w-72">
      <GroupCard {...args} />
    </div>
}`,...M.parameters?.docs?.source}}},N=[`Standard`,`StandardJoined`,`StandardNoLogo`,`StandardNoDescription`,`Sidebar`,`SidebarList`,`WithLogo`,`WithLogoJoined`,`SidebarWithLogo`]}));P();export{O as Sidebar,k as SidebarList,M as SidebarWithLogo,w as Standard,T as StandardJoined,D as StandardNoDescription,E as StandardNoLogo,A as WithLogo,j as WithLogoJoined,N as __namedExportsOrder,S as default,P as n,b as t};