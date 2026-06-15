import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{Ht as r,Vt as i,ot as a,st as o}from"./iframe-dYpfwGDq.js";var s=e({Checked:()=>d,Default:()=>u,Disabled:()=>p,DisabledChecked:()=>m,Group:()=>g,Indeterminate:()=>f,WithLabel:()=>h,__namedExportsOrder:()=>_,default:()=>l}),c,l,u,d,f,p,m,h,g,_,v=t((()=>{c=n(),r(),o(),l={title:`UI/Checkbox`,component:i,parameters:{layout:`centered`}},u={args:{}},d={args:{checked:!0}},f={args:{checked:`indeterminate`}},p={args:{disabled:!0}},m={args:{disabled:!0,checked:!0}},h={render:()=>(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsx)(i,{id:`terms`}),(0,c.jsx)(a,{htmlFor:`terms`,children:`利用規約に同意する`})]})},g={render:()=>(0,c.jsx)(`div`,{className:`flex flex-col gap-3`,children:[`フロントエンド`,`バックエンド`,`機械学習`,`DevOps`].map((e,t)=>(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsx)(i,{id:`cat-${t}`,defaultChecked:t===0}),(0,c.jsx)(a,{htmlFor:`cat-${t}`,children:e})]},e))})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    checked: true
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    checked: "indeterminate"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    checked: true
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">利用規約に同意する</Label>
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      {["フロントエンド", "バックエンド", "機械学習", "DevOps"].map((label, i) => <div key={label} className="flex items-center gap-2">
          <Checkbox id={\`cat-\${i}\`} defaultChecked={i === 0} />
          <Label htmlFor={\`cat-\${i}\`}>{label}</Label>
        </div>)}
    </div>
}`,...g.parameters?.docs?.source}}},_=[`Default`,`Checked`,`Indeterminate`,`Disabled`,`DisabledChecked`,`WithLabel`,`Group`]}));v();export{d as Checked,u as Default,p as Disabled,m as DisabledChecked,g as Group,f as Indeterminate,h as WithLabel,_ as __namedExportsOrder,l as default,v as n,s as t};