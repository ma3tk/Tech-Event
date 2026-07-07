import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{G as a,K as o,U as s,W as c,Y as l,Z as u,ot as d,st as f}from"./iframe-BpKJYaG2.js";var p=e({Default:()=>g,Sides:()=>_,__namedExportsOrder:()=>v,default:()=>h}),m,h,g,_,v,y=t((()=>{m=n(),o(),r(),u(),f(),h={title:`UI/Popover`,parameters:{layout:`centered`}},g={render:()=>(0,m.jsxs)(s,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(i,{variant:`outline`,children:`設定を開く`})}),(0,m.jsx)(c,{children:(0,m.jsxs)(`div`,{className:`grid gap-3`,children:[(0,m.jsx)(`h4`,{className:`text-sm font-semibold`,children:`寸法`}),(0,m.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,m.jsx)(d,{htmlFor:`w`,children:`幅`}),(0,m.jsx)(l,{id:`w`,defaultValue:`100%`})]}),(0,m.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,m.jsx)(d,{htmlFor:`h`,children:`高さ`}),(0,m.jsx)(l,{id:`h`,defaultValue:`auto`})]})]})})]})},_={render:()=>(0,m.jsx)(`div`,{className:`flex gap-3`,children:[`top`,`right`,`bottom`,`left`].map(e=>(0,m.jsxs)(s,{children:[(0,m.jsx)(a,{asChild:!0,children:(0,m.jsx)(i,{variant:`outline`,size:`sm`,children:e})}),(0,m.jsxs)(c,{side:e,className:`w-40 text-sm`,children:[e,` に表示されたポップオーバー`]})]},e))})},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">設定を開く</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-3">
          <h4 className="text-sm font-semibold">寸法</h4>
          <div className="grid gap-1.5">
            <Label htmlFor="w">幅</Label>
            <Input id="w" defaultValue="100%" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="h">高さ</Label>
            <Input id="h" defaultValue="auto" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex gap-3">
      {(["top", "right", "bottom", "left"] as const).map(side => <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </PopoverTrigger>
          <PopoverContent side={side} className="w-40 text-sm">
            {side} に表示されたポップオーバー
          </PopoverContent>
        </Popover>)}
    </div>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`Sides`]}));y();export{g as Default,_ as Sides,v as __namedExportsOrder,h as default,p as n,y as t};