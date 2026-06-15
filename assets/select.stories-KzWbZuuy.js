import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{F as r,I as i,L as a,M as o,N as s,P as c,R as l,j as u,z as d}from"./iframe-dYpfwGDq.js";var f=e({Default:()=>h,Disabled:()=>_,Grouped:()=>g,WithDefault:()=>v,__namedExportsOrder:()=>y,default:()=>m}),p,m,h,g,_,v,y,b=t((()=>{p=n(),d(),m={title:`UI/Select`,parameters:{layout:`centered`}},h={render:()=>(0,p.jsx)(`div`,{className:`w-60`,children:(0,p.jsxs)(u,{children:[(0,p.jsx)(a,{children:(0,p.jsx)(l,{placeholder:`カテゴリを選択`})}),(0,p.jsxs)(o,{children:[(0,p.jsx)(c,{value:`frontend`,children:`フロントエンド`}),(0,p.jsx)(c,{value:`backend`,children:`バックエンド`}),(0,p.jsx)(c,{value:`ml`,children:`機械学習`}),(0,p.jsx)(c,{value:`devops`,children:`DevOps`})]})]})})},g={render:()=>(0,p.jsx)(`div`,{className:`w-60`,children:(0,p.jsxs)(u,{children:[(0,p.jsx)(a,{children:(0,p.jsx)(l,{placeholder:`エリアを選択`})}),(0,p.jsxs)(o,{children:[(0,p.jsxs)(s,{children:[(0,p.jsx)(r,{children:`関東`}),(0,p.jsx)(c,{value:`tokyo`,children:`東京`}),(0,p.jsx)(c,{value:`kanagawa`,children:`神奈川`})]}),(0,p.jsx)(i,{}),(0,p.jsxs)(s,{children:[(0,p.jsx)(r,{children:`関西`}),(0,p.jsx)(c,{value:`osaka`,children:`大阪`}),(0,p.jsx)(c,{value:`kyoto`,children:`京都`})]})]})]})})},_={render:()=>(0,p.jsx)(`div`,{className:`w-60`,children:(0,p.jsxs)(u,{disabled:!0,children:[(0,p.jsx)(a,{children:(0,p.jsx)(l,{placeholder:`無効`})}),(0,p.jsx)(o,{})]})})},v={render:()=>(0,p.jsx)(`div`,{className:`w-60`,children:(0,p.jsxs)(u,{defaultValue:`backend`,children:[(0,p.jsx)(a,{children:(0,p.jsx)(l,{})}),(0,p.jsxs)(o,{children:[(0,p.jsx)(c,{value:`frontend`,children:`フロントエンド`}),(0,p.jsx)(c,{value:`backend`,children:`バックエンド`}),(0,p.jsx)(c,{value:`ml`,children:`機械学習`})]})]})})},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-60">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="カテゴリを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontend">フロントエンド</SelectItem>
          <SelectItem value="backend">バックエンド</SelectItem>
          <SelectItem value="ml">機械学習</SelectItem>
          <SelectItem value="devops">DevOps</SelectItem>
        </SelectContent>
      </Select>
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-60">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="エリアを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>関東</SelectLabel>
            <SelectItem value="tokyo">東京</SelectItem>
            <SelectItem value="kanagawa">神奈川</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>関西</SelectLabel>
            <SelectItem value="osaka">大阪</SelectItem>
            <SelectItem value="kyoto">京都</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-60">
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="無効" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-60">
      <Select defaultValue="backend">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontend">フロントエンド</SelectItem>
          <SelectItem value="backend">バックエンド</SelectItem>
          <SelectItem value="ml">機械学習</SelectItem>
        </SelectContent>
      </Select>
    </div>
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Grouped`,`Disabled`,`WithDefault`]}));b();export{h as Default,_ as Disabled,g as Grouped,v as WithDefault,y as __namedExportsOrder,m as default,f as n,b as t};