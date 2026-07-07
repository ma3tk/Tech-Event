import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{_ as r,g as i,h as a,m as o,p as s}from"./iframe-BpKJYaG2.js";var c=e({Default:()=>d,WithDisabled:()=>f,__namedExportsOrder:()=>p,default:()=>u}),l,u,d,f,p,m=t((()=>{l=n(),r(),u={title:`UI/Tabs`,parameters:{layout:`centered`}},d={render:()=>(0,l.jsxs)(s,{defaultValue:`overview`,className:`w-80`,children:[(0,l.jsxs)(a,{children:[(0,l.jsx)(i,{value:`overview`,children:`概要`}),(0,l.jsx)(i,{value:`schedule`,children:`スケジュール`}),(0,l.jsx)(i,{value:`participants`,children:`参加者`})]}),(0,l.jsx)(o,{value:`overview`,className:`rounded border border-border bg-surface p-4 text-sm`,children:`概要タブの内容です。`}),(0,l.jsx)(o,{value:`schedule`,className:`rounded border border-border bg-surface p-4 text-sm`,children:`スケジュールタブの内容です。`}),(0,l.jsx)(o,{value:`participants`,className:`rounded border border-border bg-surface p-4 text-sm`,children:`参加者タブの内容です。`})]})},f={render:()=>(0,l.jsxs)(s,{defaultValue:`a`,className:`w-80`,children:[(0,l.jsxs)(a,{children:[(0,l.jsx)(i,{value:`a`,children:`A`}),(0,l.jsx)(i,{value:`b`,disabled:!0,children:`B (無効)`}),(0,l.jsx)(i,{value:`c`,children:`C`})]}),(0,l.jsx)(o,{value:`a`,children:`A の内容`}),(0,l.jsx)(o,{value:`c`,children:`C の内容`})]})},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="overview" className="w-80">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="schedule">スケジュール</TabsTrigger>
        <TabsTrigger value="participants">参加者</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded border border-border bg-surface p-4 text-sm">
        概要タブの内容です。
      </TabsContent>
      <TabsContent value="schedule" className="rounded border border-border bg-surface p-4 text-sm">
        スケジュールタブの内容です。
      </TabsContent>
      <TabsContent value="participants" className="rounded border border-border bg-surface p-4 text-sm">
        参加者タブの内容です。
      </TabsContent>
    </Tabs>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Tabs defaultValue="a" className="w-80">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B (無効)
        </TabsTrigger>
        <TabsTrigger value="c">C</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A の内容</TabsContent>
      <TabsContent value="c">C の内容</TabsContent>
    </Tabs>
}`,...f.parameters?.docs?.source}}},p=[`Default`,`WithDisabled`]}));m();export{d as Default,f as WithDisabled,p as __namedExportsOrder,u as default,c as n,m as t};