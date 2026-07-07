import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{I as r,t as i,ut as a}from"./lucide-react-Dj6IqqEq.js";import{X as o,Y as s,Z as c}from"./iframe-BpKJYaG2.js";var l=e({Default:()=>f,Disabled:()=>h,InGroupWithIcon:()=>_,Invalid:()=>g,Password:()=>m,WithValue:()=>p,__namedExportsOrder:()=>v,default:()=>d}),u,d,f,p,m,h,g,_,v,y=t((()=>{u=n(),i(),c(),d={title:`UI/Input`,component:s,parameters:{layout:`centered`,docs:{description:{component:["**設計意図**: ネイティブ `<input>` を Tailwind でスタイルした最小プリミティブ。`invalid` を渡すと border が `brand-red` に変わり、`aria-invalid=true` も自動で付く (= 利用側で個別に書く必要がない)。",``,"- 必ず `<Label htmlFor>` か親の `<Label>` でラベルを紐付ける","- アイコン付きフィールドは `InputGroup` でラップして leading/trailing アイコンを配置","- フォーカスリングは `:focus-visible` + Tailwind 二重実装",``,`**Anti-pattern**:`,`- ❌ placeholder だけでラベルを省略する (= SR + 認知障害ユーザーに不親切)`,"- ❌ エラー時に `invalid` ではなく className で直接 border-red を書く (`aria-invalid` が抜ける)","- ❌ `type=number` で `step` を省略 (小数許容かどうかブラウザ依存になる)",``,`**カタログ**: [docs/catalog/01-atoms/input.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/input.md) — 使い分けガイド`].join(`
`)}}},argTypes:{type:{control:`select`,options:[`text`,`email`,`password`,`number`,`search`]},disabled:{control:`boolean`},invalid:{control:`boolean`}},args:{placeholder:`入力してください`}},f={render:e=>(0,u.jsx)(`div`,{className:`w-72`,children:(0,u.jsx)(s,{...e})})},p={render:()=>(0,u.jsx)(`div`,{className:`w-72`,children:(0,u.jsx)(s,{defaultValue:`入力済みのテキスト`})})},m={render:()=>(0,u.jsx)(`div`,{className:`w-72`,children:(0,u.jsx)(s,{type:`password`,placeholder:`パスワード`})})},h={render:()=>(0,u.jsx)(`div`,{className:`w-72`,children:(0,u.jsx)(s,{disabled:!0,placeholder:`無効`,defaultValue:`編集不可`})})},g={render:()=>(0,u.jsx)(`div`,{className:`w-72`,children:(0,u.jsx)(s,{invalid:!0,defaultValue:`不正な値`})})},_={render:()=>(0,u.jsxs)(`div`,{className:`flex w-72 flex-col gap-3`,children:[(0,u.jsxs)(o,{children:[(0,u.jsx)(r,{}),(0,u.jsx)(s,{placeholder:`イベントを検索`})]}),(0,u.jsxs)(o,{children:[(0,u.jsx)(a,{}),(0,u.jsx)(s,{type:`email`,placeholder:`email@example.com`})]}),(0,u.jsxs)(o,{invalid:!0,children:[(0,u.jsx)(a,{}),(0,u.jsx)(s,{invalid:!0,defaultValue:`不正なメール`})]}),(0,u.jsxs)(o,{disabled:!0,children:[(0,u.jsx)(a,{}),(0,u.jsx)(s,{disabled:!0,defaultValue:`無効状態`})]})]})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-72">
      <Input {...args} />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-72">
      <Input defaultValue="入力済みのテキスト" />
    </div>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-72">
      <Input type="password" placeholder="パスワード" />
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-72">
      <Input disabled placeholder="無効" defaultValue="編集不可" />
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-72">
      <Input invalid defaultValue="不正な値" />
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex w-72 flex-col gap-3">
      <InputGroup>
        <Search />
        <Input placeholder="イベントを検索" />
      </InputGroup>
      <InputGroup>
        <Mail />
        <Input type="email" placeholder="email@example.com" />
      </InputGroup>
      <InputGroup invalid>
        <Mail />
        <Input invalid defaultValue="不正なメール" />
      </InputGroup>
      <InputGroup disabled>
        <Mail />
        <Input disabled defaultValue="無効状態" />
      </InputGroup>
    </div>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`WithValue`,`Password`,`Disabled`,`Invalid`,`InGroupWithIcon`]}));y();export{f as Default,h as Disabled,_ as InGroupWithIcon,g as Invalid,m as Password,p as WithValue,v as __namedExportsOrder,d as default,l as n,y as t};