import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{Y as r,Z as i,ot as a,st as o}from"./iframe-BSzhKIvM.js";var s=e({AllSizes:()=>p,Default:()=>u,Required:()=>d,WithInput:()=>f,__namedExportsOrder:()=>m,default:()=>l}),c,l,u,d,f,p,m,h=t((()=>{c=n(),o(),i(),l={title:`UI/Label`,component:a,parameters:{layout:`centered`},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},required:{control:`boolean`}},args:{children:`メールアドレス`}},u={args:{}},d={args:{required:!0}},f={render:()=>(0,c.jsxs)(`div`,{className:`grid w-72 gap-1.5`,children:[(0,c.jsx)(a,{htmlFor:`email`,required:!0,children:`メールアドレス`}),(0,c.jsx)(r,{id:`email`,type:`email`,placeholder:`you@example.com`})]})},p={render:()=>(0,c.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,c.jsx)(a,{size:`sm`,children:`Small label`}),(0,c.jsx)(a,{size:`md`,children:`Medium label`}),(0,c.jsx)(a,{size:`lg`,children:`Large label`})]})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    required: true
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid w-72 gap-1.5">
      <Label htmlFor="email" required>
        メールアドレス
      </Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      <Label size="sm">Small label</Label>
      <Label size="md">Medium label</Label>
      <Label size="lg">Large label</Label>
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Required`,`WithInput`,`AllSizes`]}));h();export{p as AllSizes,u as Default,d as Required,f as WithInput,m as __namedExportsOrder,l as default,s as n,h as t};