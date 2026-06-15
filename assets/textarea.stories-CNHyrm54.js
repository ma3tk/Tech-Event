import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{d as r,f as i,ot as a,st as o}from"./iframe-BSzhKIvM.js";var s=e({Default:()=>u,Disabled:()=>f,Invalid:()=>p,WithLabel:()=>d,__namedExportsOrder:()=>m,default:()=>l}),c,l,u,d,f,p,m,h=t((()=>{c=n(),i(),o(),l={title:`UI/Textarea`,component:r,parameters:{layout:`centered`},argTypes:{disabled:{control:`boolean`},invalid:{control:`boolean`}},args:{placeholder:`イベントの説明...`}},u={render:e=>(0,c.jsx)(`div`,{className:`w-80`,children:(0,c.jsx)(r,{...e})})},d={render:()=>(0,c.jsxs)(`div`,{className:`grid w-80 gap-1.5`,children:[(0,c.jsx)(a,{htmlFor:`msg`,children:`メッセージ`}),(0,c.jsx)(r,{id:`msg`,placeholder:`自由記入...`,rows:5})]})},f={render:()=>(0,c.jsx)(`div`,{className:`w-80`,children:(0,c.jsx)(r,{disabled:!0,defaultValue:`編集できません`})})},p={render:()=>(0,c.jsx)(`div`,{className:`w-80`,children:(0,c.jsx)(r,{invalid:!0,defaultValue:`エラー状態`})})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-80">
      <Textarea {...args} />
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid w-80 gap-1.5">
      <Label htmlFor="msg">メッセージ</Label>
      <Textarea id="msg" placeholder="自由記入..." rows={5} />
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-80">
      <Textarea disabled defaultValue="編集できません" />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-80">
      <Textarea invalid defaultValue="エラー状態" />
    </div>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`WithLabel`,`Disabled`,`Invalid`]}));h();export{u as Default,f as Disabled,p as Invalid,d as WithLabel,m as __namedExportsOrder,l as default,s as n,h as t};