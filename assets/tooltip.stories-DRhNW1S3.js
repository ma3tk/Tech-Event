import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{bt as a,t as o}from"./lucide-react-Dj6IqqEq.js";import{a as s,i as c,n as l,o as u,r as d}from"./iframe-BpKJYaG2.js";var f=e({Default:()=>h,Sides:()=>g,WithIcon:()=>_,__namedExportsOrder:()=>v,default:()=>m}),p,m,h,g,_,v,y=t((()=>{p=n(),o(),u(),r(),m={title:`UI/Tooltip`,parameters:{layout:`centered`},decorators:[e=>(0,p.jsx)(c,{delayDuration:150,children:(0,p.jsx)(e,{})})]},h={render:()=>(0,p.jsxs)(l,{children:[(0,p.jsx)(s,{asChild:!0,children:(0,p.jsx)(i,{variant:`outline`,children:`Hover してね`})}),(0,p.jsx)(d,{children:`ツールチップの内容`})]})},g={render:()=>(0,p.jsx)(`div`,{className:`flex items-center gap-6`,children:[`top`,`right`,`bottom`,`left`].map(e=>(0,p.jsxs)(l,{children:[(0,p.jsx)(s,{asChild:!0,children:(0,p.jsx)(i,{variant:`outline`,size:`sm`,children:e})}),(0,p.jsxs)(d,{side:e,children:[e,` に表示`]})]},e))})},_={render:()=>(0,p.jsxs)(l,{children:[(0,p.jsx)(s,{asChild:!0,children:(0,p.jsx)(`button`,{"aria-label":`ヘルプ`,className:`inline-flex size-8 items-center justify-center rounded-full hover:bg-background`,children:(0,p.jsx)(a,{className:`size-4 text-muted-foreground`})})}),(0,p.jsx)(d,{children:`キャパシティを上回ると補欠リストに回されます`})]})},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover してね</Button>
      </TooltipTrigger>
      <TooltipContent>ツールチップの内容</TooltipContent>
    </Tooltip>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-6">
      {(["top", "right", "bottom", "left"] as const).map(side => <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>{side} に表示</TooltipContent>
        </Tooltip>)}
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <Tooltip>
      <TooltipTrigger asChild>
        <button aria-label="ヘルプ" className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background">
          <Info className="size-4 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>キャパシティを上回ると補欠リストに回されます</TooltipContent>
    </Tooltip>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`Sides`,`WithIcon`]}));y();export{h as Default,g as Sides,_ as WithIcon,v as __namedExportsOrder,m as default,f as n,y as t};