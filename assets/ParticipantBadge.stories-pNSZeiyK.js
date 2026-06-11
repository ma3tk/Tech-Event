import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{c as a,t as o}from"./lucide-react-Dj6IqqEq.js";import{$t as s,Qt as c,a as l,en as u,n as d,r as f,t as p}from"./iframe-O2Td0HUc.js";import{n as m,t as h}from"./link-Du4AGLbo.js";function g(e){let{size:t=`md`,iconOnly:n=!1,appliedAt:i,ticketName:o,status:p,profileUrl:h,className:g}=e,x=`user`in e&&e.user?e.user.displayName||e.user.nickname:e.nickname,S=`user`in e&&e.user?e.user.avatarUrl??void 0:e.avatarUrl??void 0,C=(0,v.jsxs)(c,{className:r(`border border-border bg-brand-orange-soft text-brand-orange`,y[t]),children:[S?(0,v.jsx)(u,{src:S,alt:``,loading:`lazy`}):null,(0,v.jsx)(s,{className:`bg-brand-orange-soft text-brand-orange`,children:(0,v.jsx)(a,{"aria-hidden":`true`,className:`h-1/2 w-1/2`})})]}),w=i||o||p,T=(0,v.jsxs)(`span`,{className:r(`inline-flex items-start gap-2`,b[t],g),children:[C,n?(0,v.jsx)(`span`,{className:`sr-only`,children:x}):(0,v.jsxs)(`span`,{className:`flex min-w-0 flex-col`,children:[(0,v.jsx)(`span`,{className:`font-medium text-foreground truncate max-w-[14rem]`,children:x}),w&&(0,v.jsxs)(`span`,{className:`text-xs text-muted-foreground flex flex-wrap gap-x-2`,children:[o&&(0,v.jsx)(`span`,{children:o}),p&&(0,v.jsx)(`span`,{children:p}),i&&(0,v.jsx)(`time`,{dateTime:i,children:_(i)})]})]})]}),E=h?(0,v.jsx)(m,{href:h,"aria-label":`${x} のプロフィール`,className:`inline-block hover:text-brand-orange`,children:T}):null;return n?(0,v.jsxs)(d,{children:[(0,v.jsx)(l,{asChild:!0,children:E??T}),(0,v.jsx)(f,{children:x})]}):E??T}function _(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:`${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)} 申込`}var v,y,b,x=t((()=>{v=n(),h(),o(),i(),p(),y={sm:`h-5 w-5`,md:`h-6 w-6`,lg:`h-8 w-8`},b={sm:`text-xs`,md:`text-sm`,lg:`text-base`},g.__docgenInfo={description:"参加者を 1 人分表示する小型 UI (アバター + ニックネーム)。\n主催者表示、参加者リスト、コメント著者などで使う。\n\n内部のアバターは `ui/Avatar` + `AvatarImage` + `AvatarFallback` 構成。\n`iconOnly` モードのときは `ui/Tooltip` で hover/focus 時にニックネームを表示。",methods:[],displayName:`ParticipantBadge`}})),S=e({AllSizes:()=>k,Default:()=>T,IconOnly:()=>A,ParticipantList:()=>M,WithAvatar:()=>E,WithDiceBearAvatar:()=>N,WithMeta:()=>O,WithProfileLink:()=>j,WithUserObject:()=>D,__namedExportsOrder:()=>P,default:()=>w}),C,w,T,E,D,O,k,A,j,M,N,P,F=t((()=>{C=n(),x(),w={title:`Components/ParticipantBadge`,component:g,parameters:{layout:`padded`},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},iconOnly:{control:`boolean`}}},T={args:{nickname:`tanaka_san`}},E={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=8`}},D={args:{user:{id:`u1`,nickname:`yamada`,displayName:`山田 太郎`,avatarUrl:`https://i.pravatar.cc/64?img=15`}}},O={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=22`,ticketName:`一般枠`,status:`参加確定`,appliedAt:`2026-05-20T10:00:00+09:00`}},k={render:()=>(0,C.jsxs)(`div`,{className:`flex items-center gap-6 bg-surface p-4`,children:[(0,C.jsx)(g,{nickname:`sm`,size:`sm`}),(0,C.jsx)(g,{nickname:`md`,size:`md`}),(0,C.jsx)(g,{nickname:`lg`,size:`lg`})]})},A={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=33`,iconOnly:!0}},j={args:{nickname:`tanaka_san`,profileUrl:`/user/tanaka`,avatarUrl:`https://i.pravatar.cc/64?img=44`}},M={render:()=>(0,C.jsx)(`ul`,{className:`flex flex-col divide-y divide-border rounded-md border border-border bg-surface`,children:[{name:`tanaka`,ticket:`一般枠`,date:`2026-05-20T10:00:00+09:00`},{name:`yamada`,ticket:`学生枠`,date:`2026-05-21T14:30:00+09:00`},{name:`suzuki`,ticket:`一般枠`,date:`2026-05-22T09:00:00+09:00`}].map((e,t)=>(0,C.jsx)(`li`,{className:`p-3`,children:(0,C.jsx)(g,{nickname:e.name,avatarUrl:`https://i.pravatar.cc/64?img=${t+1}`,ticketName:e.ticket,appliedAt:e.date})},e.name))})},N={render:()=>(0,C.jsxs)(`div`,{className:`flex flex-col gap-4 bg-surface p-4`,children:[(0,C.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,C.jsx)(g,{nickname:`dicebear_sm`,size:`sm`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-sm`}),(0,C.jsx)(g,{nickname:`dicebear_md`,size:`md`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-md`}),(0,C.jsx)(g,{nickname:`dicebear_lg`,size:`lg`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-lg`})]}),(0,C.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,C.jsx)(g,{nickname:`iconOnly_sm`,size:`sm`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-sm`}),(0,C.jsx)(g,{nickname:`iconOnly_md`,size:`md`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-md`}),(0,C.jsx)(g,{nickname:`iconOnly_lg`,size:`lg`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-lg`})]}),(0,C.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,C.jsx)(g,{nickname:`with_link`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=with-link`,profileUrl:`/user/with-link`}),(0,C.jsx)(g,{nickname:`with_meta`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=with-meta`,ticketName:`一般枠`,status:`参加確定`,appliedAt:`2026-06-01T12:00:00+09:00`})]})]})},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san"
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=8"
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    user: {
      id: "u1",
      nickname: "yamada",
      displayName: "山田 太郎",
      avatarUrl: "https://i.pravatar.cc/64?img=15"
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=22",
    ticketName: "一般枠",
    status: "参加確定",
    appliedAt: "2026-05-20T10:00:00+09:00"
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-6 bg-surface p-4">
      <ParticipantBadge nickname="sm" size="sm" />
      <ParticipantBadge nickname="md" size="md" />
      <ParticipantBadge nickname="lg" size="lg" />
    </div>
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=33",
    iconOnly: true
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    profileUrl: "/user/tanaka",
    avatarUrl: "https://i.pravatar.cc/64?img=44"
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: () => <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
      {[{
      name: "tanaka",
      ticket: "一般枠",
      date: "2026-05-20T10:00:00+09:00"
    }, {
      name: "yamada",
      ticket: "学生枠",
      date: "2026-05-21T14:30:00+09:00"
    }, {
      name: "suzuki",
      ticket: "一般枠",
      date: "2026-05-22T09:00:00+09:00"
    }].map((p, i) => <li key={p.name} className="p-3">
          <ParticipantBadge nickname={p.name} avatarUrl={\`https://i.pravatar.cc/64?img=\${i + 1}\`} ticketName={p.ticket} appliedAt={p.date} />
        </li>)}
    </ul>
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge nickname="dicebear_sm" size="sm" avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-sm" />
        <ParticipantBadge nickname="dicebear_md" size="md" avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-md" />
        <ParticipantBadge nickname="dicebear_lg" size="lg" avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge nickname="iconOnly_sm" size="sm" iconOnly avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-sm" />
        <ParticipantBadge nickname="iconOnly_md" size="md" iconOnly avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-md" />
        <ParticipantBadge nickname="iconOnly_lg" size="lg" iconOnly avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <ParticipantBadge nickname="with_link" avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=with-link" profileUrl="/user/with-link" />
        <ParticipantBadge nickname="with_meta" avatarUrl="https://api.dicebear.com/9.x/identicon/svg?seed=with-meta" ticketName="一般枠" status="参加確定" appliedAt="2026-06-01T12:00:00+09:00" />
      </div>
    </div>
}`,...N.parameters?.docs?.source},description:{story:`DiceBear (identicon) で安定したアバター画像を生成するパターン。
カバレッジ表の "ParticipantBadge avatarUrl 100%" の根拠ストーリー。
- https://api.dicebear.com/9.x/identicon/svg?seed=<name>`,...N.parameters?.docs?.description}}},P=[`Default`,`WithAvatar`,`WithUserObject`,`WithMeta`,`AllSizes`,`IconOnly`,`WithProfileLink`,`ParticipantList`,`WithDiceBearAvatar`]}));F();export{k as AllSizes,T as Default,A as IconOnly,M as ParticipantList,E as WithAvatar,N as WithDiceBearAvatar,O as WithMeta,j as WithProfileLink,D as WithUserObject,P as __namedExportsOrder,w as default,F as n,S as t};