import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,r as i,t as a}from"./EventStatusBadge-DZBstfLh.js";var o=e({AllSizes:()=>f,AllStatuses:()=>u,AllVariants:()=>d,CustomLabel:()=>p,Default:()=>l,__namedExportsOrder:()=>m,default:()=>c}),s,c,l,u,d,f,p,m,h=t((()=>{s=n(),i(),c={title:`Components/EventStatusBadge`,component:r,parameters:{layout:`centered`,docs:{description:{component:`イベントの募集/開催ステータスを表すバッジ。色のみに依存させないため、ラベルテキストを必ず表示する。`}}},argTypes:{status:{control:`select`,options:a},size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},variant:{control:`inline-radio`,options:[`subtle`,`solid`,`outline`,`dot`]}}},l={args:{status:`open`}},u={render:()=>(0,s.jsx)(`div`,{className:`flex flex-wrap gap-2 bg-surface p-4`,children:a.map(e=>(0,s.jsx)(r,{status:e},e))})},d={render:()=>(0,s.jsxs)(`div`,{className:`flex flex-col gap-3 bg-surface p-4`,children:[[`subtle`,`solid`,`outline`].map(e=>(0,s.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,s.jsx)(`span`,{className:`w-16 text-xs text-muted-foreground`,children:e}),(0,s.jsx)(r,{status:`open`,variant:e}),(0,s.jsx)(r,{status:`full`,variant:e}),(0,s.jsx)(r,{status:`waitlist`,variant:e}),(0,s.jsx)(r,{status:`cancelled`,variant:e})]},e)),(0,s.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,s.jsx)(`span`,{className:`w-16 text-xs text-muted-foreground`,children:`dot`}),(0,s.jsx)(r,{status:`open`,variant:`dot`}),(0,s.jsx)(r,{status:`full`,variant:`dot`}),(0,s.jsx)(r,{status:`waitlist`,variant:`dot`}),(0,s.jsx)(r,{status:`cancelled`,variant:`dot`})]})]})},f={render:()=>(0,s.jsxs)(`div`,{className:`flex items-center gap-3 bg-surface p-4`,children:[(0,s.jsx)(r,{status:`open`,size:`sm`}),(0,s.jsx)(r,{status:`open`,size:`md`}),(0,s.jsx)(r,{status:`open`,size:`lg`})]})},p={args:{status:`open`,label:`募集中 (残り3名)`}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    status: "open"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2 bg-surface p-4">
      {EVENT_STATUSES.map((s: EventStatus) => <EventStatusBadge key={s} status={s} />)}
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 bg-surface p-4">
      {(["subtle", "solid", "outline"] as const).map(v => <div key={v} className="flex items-center gap-2">
          <span className="w-16 text-xs text-muted-foreground">{v}</span>
          <EventStatusBadge status="open" variant={v} />
          <EventStatusBadge status="full" variant={v} />
          <EventStatusBadge status="waitlist" variant={v} />
          <EventStatusBadge status="cancelled" variant={v} />
        </div>)}
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs text-muted-foreground">dot</span>
        <EventStatusBadge status="open" variant="dot" />
        <EventStatusBadge status="full" variant="dot" />
        <EventStatusBadge status="waitlist" variant="dot" />
        <EventStatusBadge status="cancelled" variant="dot" />
      </div>
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3 bg-surface p-4">
      <EventStatusBadge status="open" size="sm" />
      <EventStatusBadge status="open" size="md" />
      <EventStatusBadge status="open" size="lg" />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    status: "open",
    label: "募集中 (残り3名)"
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`AllStatuses`,`AllVariants`,`AllSizes`,`CustomLabel`]}));h();export{f as AllSizes,u as AllStatuses,d as AllVariants,p as CustomLabel,l as Default,m as __namedExportsOrder,c as default,h as n,o as t};