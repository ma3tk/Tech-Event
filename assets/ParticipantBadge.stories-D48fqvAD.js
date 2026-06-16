import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{c as a,t as o}from"./lucide-react-Dj6IqqEq.js";import{$t as s,Qt as c,a as l,en as u,n as d,r as f,t as p}from"./iframe-Dnrprrp7.js";import{n as m,t as h}from"./link-Du4AGLbo.js";import{i as g,t as _}from"./tokyo-date-C7xVqw07.js";function v(e){let{size:t=`md`,iconOnly:n=!1,appliedAt:i,ticketName:o,status:p,profileUrl:h,className:g}=e,_=`user`in e&&e.user?e.user.displayName||e.user.nickname:e.nickname,v=`user`in e&&e.user?e.user.avatarUrl??void 0:e.avatarUrl??void 0,C=(0,b.jsxs)(c,{className:r(`border border-border bg-brand-orange-soft text-brand-orange`,x[t]),children:[v?(0,b.jsx)(u,{src:v,alt:``,loading:`lazy`}):null,(0,b.jsx)(s,{className:`bg-brand-orange-soft text-brand-orange`,children:(0,b.jsx)(a,{"aria-hidden":`true`,className:`h-1/2 w-1/2`})})]}),w=i||o||p,T=(0,b.jsxs)(`span`,{className:r(`inline-flex items-start gap-2`,S[t],g),children:[C,n?(0,b.jsx)(`span`,{className:`sr-only`,children:_}):(0,b.jsxs)(`span`,{className:`flex min-w-0 flex-col`,children:[(0,b.jsx)(`span`,{className:`font-medium text-foreground truncate max-w-[14rem]`,children:_}),w&&(0,b.jsxs)(`span`,{className:`text-xs text-muted-foreground flex flex-wrap gap-x-2`,children:[o&&(0,b.jsx)(`span`,{children:o}),p&&(0,b.jsx)(`span`,{children:p}),i&&(0,b.jsx)(`time`,{dateTime:i,children:y(i)})]})]})]}),E=h?(0,b.jsx)(m,{href:h,"aria-label":`${_} のプロフィール`,className:`inline-block hover:text-brand-orange`,children:T}):null;return n?(0,b.jsxs)(d,{children:[(0,b.jsx)(l,{asChild:!0,children:E??T}),(0,b.jsx)(f,{children:_})]}):E??T}function y(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:`${g(t)} 申込`}var b,x,S,C=t((()=>{b=n(),h(),o(),i(),p(),_(),x={sm:`h-5 w-5`,md:`h-6 w-6`,lg:`h-8 w-8`},S={sm:`text-xs`,md:`text-sm`,lg:`text-base`},v.__docgenInfo={description:"参加者を 1 人分表示する小型 UI (アバター + ニックネーム)。\n主催者表示、参加者リスト、コメント著者などで使う。\n\n内部のアバターは `ui/Avatar` + `AvatarImage` + `AvatarFallback` 構成。\n`iconOnly` モードのときは `ui/Tooltip` で hover/focus 時にニックネームを表示。",methods:[],displayName:`ParticipantBadge`}})),w=e({AllSizes:()=>j,Default:()=>D,IconOnly:()=>M,ParticipantList:()=>P,WithAvatar:()=>O,WithDiceBearAvatar:()=>F,WithMeta:()=>A,WithProfileLink:()=>N,WithUserObject:()=>k,__namedExportsOrder:()=>I,default:()=>E}),T,E,D,O,k,A,j,M,N,P,F,I,L=t((()=>{T=n(),C(),E={title:`Components/ParticipantBadge`,component:v,parameters:{layout:`padded`},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},iconOnly:{control:`boolean`}}},D={args:{nickname:`tanaka_san`}},O={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=8`}},k={args:{user:{id:`u1`,nickname:`yamada`,displayName:`山田 太郎`,avatarUrl:`https://i.pravatar.cc/64?img=15`}}},A={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=22`,ticketName:`一般枠`,status:`参加確定`,appliedAt:`2026-05-20T10:00:00+09:00`}},j={render:()=>(0,T.jsxs)(`div`,{className:`flex items-center gap-6 bg-surface p-4`,children:[(0,T.jsx)(v,{nickname:`sm`,size:`sm`}),(0,T.jsx)(v,{nickname:`md`,size:`md`}),(0,T.jsx)(v,{nickname:`lg`,size:`lg`})]})},M={args:{nickname:`tanaka_san`,avatarUrl:`https://i.pravatar.cc/64?img=33`,iconOnly:!0}},N={args:{nickname:`tanaka_san`,profileUrl:`/user/tanaka`,avatarUrl:`https://i.pravatar.cc/64?img=44`}},P={render:()=>(0,T.jsx)(`ul`,{className:`flex flex-col divide-y divide-border rounded-md border border-border bg-surface`,children:[{name:`tanaka`,ticket:`一般枠`,date:`2026-05-20T10:00:00+09:00`},{name:`yamada`,ticket:`学生枠`,date:`2026-05-21T14:30:00+09:00`},{name:`suzuki`,ticket:`一般枠`,date:`2026-05-22T09:00:00+09:00`}].map((e,t)=>(0,T.jsx)(`li`,{className:`p-3`,children:(0,T.jsx)(v,{nickname:e.name,avatarUrl:`https://i.pravatar.cc/64?img=${t+1}`,ticketName:e.ticket,appliedAt:e.date})},e.name))})},F={render:()=>(0,T.jsxs)(`div`,{className:`flex flex-col gap-4 bg-surface p-4`,children:[(0,T.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,T.jsx)(v,{nickname:`dicebear_sm`,size:`sm`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-sm`}),(0,T.jsx)(v,{nickname:`dicebear_md`,size:`md`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-md`}),(0,T.jsx)(v,{nickname:`dicebear_lg`,size:`lg`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=dicebear-lg`})]}),(0,T.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,T.jsx)(v,{nickname:`iconOnly_sm`,size:`sm`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-sm`}),(0,T.jsx)(v,{nickname:`iconOnly_md`,size:`md`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-md`}),(0,T.jsx)(v,{nickname:`iconOnly_lg`,size:`lg`,iconOnly:!0,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=icon-only-lg`})]}),(0,T.jsxs)(`div`,{className:`flex flex-wrap items-center gap-6`,children:[(0,T.jsx)(v,{nickname:`with_link`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=with-link`,profileUrl:`/user/with-link`}),(0,T.jsx)(v,{nickname:`with_meta`,avatarUrl:`https://api.dicebear.com/9.x/identicon/svg?seed=with-meta`,ticketName:`一般枠`,status:`参加確定`,appliedAt:`2026-06-01T12:00:00+09:00`})]})]})},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san"
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=8"
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    user: {
      id: "u1",
      nickname: "yamada",
      displayName: "山田 太郎",
      avatarUrl: "https://i.pravatar.cc/64?img=15"
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=22",
    ticketName: "一般枠",
    status: "参加確定",
    appliedAt: "2026-05-20T10:00:00+09:00"
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-6 bg-surface p-4">
      <ParticipantBadge nickname="sm" size="sm" />
      <ParticipantBadge nickname="md" size="md" />
      <ParticipantBadge nickname="lg" size="lg" />
    </div>
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    avatarUrl: "https://i.pravatar.cc/64?img=33",
    iconOnly: true
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    nickname: "tanaka_san",
    profileUrl: "/user/tanaka",
    avatarUrl: "https://i.pravatar.cc/64?img=44"
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
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
}`,...F.parameters?.docs?.source},description:{story:`DiceBear (identicon) で安定したアバター画像を生成するパターン。
カバレッジ表の "ParticipantBadge avatarUrl 100%" の根拠ストーリー。
- https://api.dicebear.com/9.x/identicon/svg?seed=<name>`,...F.parameters?.docs?.description}}},I=[`Default`,`WithAvatar`,`WithUserObject`,`WithMeta`,`AllSizes`,`IconOnly`,`WithProfileLink`,`ParticipantList`,`WithDiceBearAvatar`]}));L();export{j as AllSizes,D as Default,M as IconOnly,P as ParticipantList,O as WithAvatar,F as WithDiceBearAvatar,A as WithMeta,N as WithProfileLink,k as WithUserObject,I as __namedExportsOrder,E as default,L as n,w as t};