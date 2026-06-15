import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{$t as r,Qt as i,en as a,tn as o}from"./iframe-BSzhKIvM.js";var s=e({Fallback:()=>d,Group:()=>p,Sizes:()=>f,WithImage:()=>u,__namedExportsOrder:()=>m,default:()=>l}),c,l,u,d,f,p,m,h=t((()=>{c=n(),o(),l={title:`UI/Avatar`,component:i,parameters:{layout:`centered`}},u={render:()=>(0,c.jsxs)(i,{children:[(0,c.jsx)(a,{src:`https://api.dicebear.com/7.x/avataaars/svg?seed=tech-event`,alt:`Yamada Taro`}),(0,c.jsx)(r,{children:`YT`})]})},d={render:()=>(0,c.jsx)(i,{children:(0,c.jsx)(r,{children:`SK`})})},f={render:()=>(0,c.jsxs)(`div`,{className:`flex items-end gap-3`,children:[(0,c.jsx)(i,{className:`h-6 w-6`,children:(0,c.jsx)(r,{className:`text-[10px]`,children:`A`})}),(0,c.jsx)(i,{className:`h-8 w-8`,children:(0,c.jsx)(r,{className:`text-xs`,children:`B`})}),(0,c.jsx)(i,{children:(0,c.jsx)(r,{children:`C`})}),(0,c.jsx)(i,{className:`h-14 w-14`,children:(0,c.jsx)(r,{className:`text-base`,children:`D`})}),(0,c.jsx)(i,{className:`h-20 w-20`,children:(0,c.jsx)(r,{className:`text-lg`,children:`E`})})]})},p={render:()=>(0,c.jsx)(`div`,{className:`-space-x-2 flex`,children:[`A`,`B`,`C`,`D`].map(e=>(0,c.jsx)(i,{className:`border-2 border-surface`,children:(0,c.jsx)(r,{children:e})},e))})},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=tech-event" alt="Yamada Taro" />
      <AvatarFallback>YT</AvatarFallback>
    </Avatar>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Avatar>
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-end gap-3">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-[10px]">A</AvatarFallback>
      </Avatar>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">B</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarFallback className="text-base">D</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20">
        <AvatarFallback className="text-lg">E</AvatarFallback>
      </Avatar>
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div className="-space-x-2 flex">
      {["A", "B", "C", "D"].map(s => <Avatar key={s} className="border-2 border-surface">
          <AvatarFallback>{s}</AvatarFallback>
        </Avatar>)}
    </div>
}`,...p.parameters?.docs?.source}}},m=[`WithImage`,`Fallback`,`Sizes`,`Group`]}));h();export{d as Fallback,p as Group,f as Sizes,u as WithImage,m as __namedExportsOrder,l as default,h as n,s as t};