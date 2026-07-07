import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{ot as r,st as i,v as a,y as o}from"./iframe-BpKJYaG2.js";var s=e({Checked:()=>d,Default:()=>u,Disabled:()=>f,DisabledChecked:()=>p,SettingsList:()=>h,WithLabel:()=>m,__namedExportsOrder:()=>g,default:()=>l}),c,l,u,d,f,p,m,h,g,_=t((()=>{c=n(),o(),i(),l={title:`UI/Switch`,component:a,parameters:{layout:`centered`}},u={args:{}},d={args:{defaultChecked:!0}},f={args:{disabled:!0}},p={args:{disabled:!0,defaultChecked:!0}},m={render:()=>(0,c.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,c.jsx)(a,{id:`notify`,defaultChecked:!0}),(0,c.jsx)(r,{htmlFor:`notify`,children:`通知を受け取る`})]})},h={render:()=>(0,c.jsx)(`div`,{className:`flex flex-col gap-4`,children:[[`メール通知`,!0],[`プッシュ通知`,!1],[`週次まとめ`,!0]].map(([e,t])=>(0,c.jsxs)(`div`,{className:`flex items-center justify-between gap-6`,children:[(0,c.jsx)(r,{htmlFor:`s-${e}`,children:String(e)}),(0,c.jsx)(a,{id:`s-${e}`,defaultChecked:!!t})]},String(e)))})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    defaultChecked: true
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    defaultChecked: true
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3">
      <Switch id="notify" defaultChecked />
      <Label htmlFor="notify">通知を受け取る</Label>
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      {[["メール通知", true], ["プッシュ通知", false], ["週次まとめ", true]].map(([label, checked]) => <div key={String(label)} className="flex items-center justify-between gap-6">
          <Label htmlFor={\`s-\${label}\`}>{String(label)}</Label>
          <Switch id={\`s-\${label}\`} defaultChecked={Boolean(checked)} />
        </div>)}
    </div>
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Checked`,`Disabled`,`DisabledChecked`,`WithLabel`,`SettingsList`]}));_();export{d as Checked,u as Default,f as Disabled,p as DisabledChecked,h as SettingsList,m as WithLabel,g as __namedExportsOrder,l as default,s as n,_ as t};