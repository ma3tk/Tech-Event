import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{B as r,H as i,V as a,ot as o,st as s}from"./iframe-dYpfwGDq.js";var c=e({Default:()=>d,Disabled:()=>f,Horizontal:()=>p,__namedExportsOrder:()=>m,default:()=>u}),l,u,d,f,p,m,h=t((()=>{l=n(),i(),s(),u={title:`UI/RadioGroup`,parameters:{layout:`centered`}},d={render:()=>(0,l.jsxs)(r,{defaultValue:`online`,children:[(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`r-online`,value:`online`}),(0,l.jsx)(o,{htmlFor:`r-online`,children:`オンライン`})]}),(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`r-offline`,value:`offline`}),(0,l.jsx)(o,{htmlFor:`r-offline`,children:`オフライン`})]}),(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`r-hybrid`,value:`hybrid`}),(0,l.jsx)(o,{htmlFor:`r-hybrid`,children:`ハイブリッド`})]})]})},f={render:()=>(0,l.jsxs)(r,{defaultValue:`a`,disabled:!0,children:[(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`d-a`,value:`a`}),(0,l.jsx)(o,{htmlFor:`d-a`,children:`A`})]}),(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`d-b`,value:`b`}),(0,l.jsx)(o,{htmlFor:`d-b`,children:`B`})]})]})},p={render:()=>(0,l.jsx)(r,{defaultValue:`md`,className:`flex gap-4`,children:[`sm`,`md`,`lg`].map(e=>(0,l.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,l.jsx)(a,{id:`h-${e}`,value:e}),(0,l.jsx)(o,{htmlFor:`h-${e}`,children:e})]},e))})},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <RadioGroup defaultValue="online">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-online" value="online" />
        <Label htmlFor="r-online">オンライン</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-offline" value="offline" />
        <Label htmlFor="r-offline">オフライン</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-hybrid" value="hybrid" />
        <Label htmlFor="r-hybrid">ハイブリッド</Label>
      </div>
    </RadioGroup>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <RadioGroup defaultValue="a" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="d-a" value="a" />
        <Label htmlFor="d-a">A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="d-b" value="b" />
        <Label htmlFor="d-b">B</Label>
      </div>
    </RadioGroup>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <RadioGroup defaultValue="md" className="flex gap-4">
      {["sm", "md", "lg"].map(v => <div key={v} className="flex items-center gap-2">
          <RadioGroupItem id={\`h-\${v}\`} value={v} />
          <Label htmlFor={\`h-\${v}\`}>{v}</Label>
        </div>)}
    </RadioGroup>
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Disabled`,`Horizontal`]}));h();export{d as Default,f as Disabled,p as Horizontal,m as __namedExportsOrder,u as default,c as n,h as t};