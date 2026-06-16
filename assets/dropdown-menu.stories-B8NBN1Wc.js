import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{M as a,c as o,ft as s,t as c}from"./lucide-react-Dj6IqqEq.js";import{At as l,Ct as u,Dt as d,Et as f,Ot as p,St as m,Tt as h,_t as g,bt as _,jt as v,kt as y,vt as b,wt as x,xt as S,yt as C}from"./iframe-Dl0jzNl2.js";var w=e({Default:()=>D,WithCheckboxAndRadio:()=>O,WithSubmenu:()=>k,__namedExportsOrder:()=>A,default:()=>E}),T,E,D,O,k,A,j=t((()=>{T=n(),c(),v(),r(),E={title:`UI/DropdownMenu`,parameters:{layout:`centered`}},D={render:()=>(0,T.jsxs)(g,{children:[(0,T.jsx)(l,{asChild:!0,children:(0,T.jsx)(i,{variant:`outline`,children:`メニューを開く`})}),(0,T.jsxs)(C,{className:`w-56`,children:[(0,T.jsx)(m,{children:`アカウント`}),(0,T.jsx)(h,{}),(0,T.jsxs)(_,{children:[(0,T.jsxs)(S,{children:[(0,T.jsx)(o,{}),(0,T.jsx)(`span`,{children:`プロフィール`}),(0,T.jsx)(f,{children:`⇧⌘P`})]}),(0,T.jsxs)(S,{children:[(0,T.jsx)(a,{}),(0,T.jsx)(`span`,{children:`設定`})]})]}),(0,T.jsx)(h,{}),(0,T.jsxs)(S,{children:[(0,T.jsx)(s,{}),(0,T.jsx)(`span`,{children:`ログアウト`})]})]})]})},O={render:()=>(0,T.jsxs)(g,{children:[(0,T.jsx)(l,{asChild:!0,children:(0,T.jsx)(i,{variant:`outline`,children:`表示設定`})}),(0,T.jsxs)(C,{className:`w-56`,children:[(0,T.jsx)(m,{children:`表示項目`}),(0,T.jsx)(h,{}),(0,T.jsx)(b,{checked:!0,children:`キャパシティ`}),(0,T.jsx)(b,{children:`主催者`}),(0,T.jsx)(b,{checked:!0,children:`タグ`}),(0,T.jsx)(h,{}),(0,T.jsx)(m,{children:`並び順`}),(0,T.jsxs)(u,{value:`date`,children:[(0,T.jsx)(x,{value:`date`,children:`日付順`}),(0,T.jsx)(x,{value:`popular`,children:`人気順`}),(0,T.jsx)(x,{value:`new`,children:`新着順`})]})]})]})},k={render:()=>(0,T.jsxs)(g,{children:[(0,T.jsx)(l,{asChild:!0,children:(0,T.jsx)(i,{variant:`outline`,children:`共有`})}),(0,T.jsxs)(C,{children:[(0,T.jsx)(S,{children:`リンクをコピー`}),(0,T.jsxs)(d,{children:[(0,T.jsx)(y,{children:`SNS で共有`}),(0,T.jsxs)(p,{children:[(0,T.jsx)(S,{children:`X (Twitter)`}),(0,T.jsx)(S,{children:`Facebook`}),(0,T.jsx)(S,{children:`LinkedIn`})]})]}),(0,T.jsx)(h,{}),(0,T.jsx)(S,{children:`QR コード`})]})]})},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">メニューを開く</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>アカウント</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            <span>プロフィール</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            <span>設定</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: () => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">表示設定</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>表示項目</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>キャパシティ</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>主催者</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>タグ</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>並び順</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="date">
          <DropdownMenuRadioItem value="date">日付順</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="popular">人気順</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="new">新着順</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">共有</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>リンクをコピー</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>SNS で共有</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>X (Twitter)</DropdownMenuItem>
            <DropdownMenuItem>Facebook</DropdownMenuItem>
            <DropdownMenuItem>LinkedIn</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>QR コード</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
}`,...k.parameters?.docs?.source}}},A=[`Default`,`WithCheckboxAndRadio`,`WithSubmenu`]}));j();export{D as Default,O as WithCheckboxAndRadio,k as WithSubmenu,A as __namedExportsOrder,E as default,j as n,w as t};