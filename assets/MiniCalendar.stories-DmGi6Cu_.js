import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{n as a,t as o}from"./link-Du4AGLbo.js";function s(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function c({baseDate:e=new Date,eventDates:t,className:n}){let i=e.getFullYear(),o=e.getMonth(),c=new Date(i,o,1).getDay(),d=new Date(i,o+1,0).getDate(),f=s(new Date),p=[];for(let e=0;e<c;e++){let t=new Date(i,o,e-c+1);p.push({day:t.getDate(),inCurrentMonth:!1,ymdString:s(t)})}for(let e=1;e<=d;e++)p.push({day:e,inCurrentMonth:!0,ymdString:s(new Date(i,o,e))});for(;p.length%7!=0;){let e=p[p.length-1],t=new Date(e.ymdString);t.setDate(t.getDate()+1),p.push({day:t.getDate(),inCurrentMonth:!1,ymdString:s(t)})}return(0,l.jsxs)(`section`,{"aria-label":`イベントカレンダー`,className:r(`rounded-md border border-border bg-surface p-3`,n),children:[(0,l.jsxs)(`h3`,{className:`mb-2 text-center text-sm font-bold text-foreground`,children:[i,`年`,o+1,`月`]}),(0,l.jsxs)(`div`,{className:`grid grid-cols-7 gap-px text-center text-[10px] text-muted-foreground`,children:[u.map((e,t)=>(0,l.jsx)(`div`,{className:r(`py-1 font-semibold`,t===0&&`text-status-cancelled-bg`,t===6&&`text-link`),children:e},e)),p.map((e,n)=>{let i=t.has(e.ymdString),o=e.ymdString===f,s=n%7;return(0,l.jsxs)(a,{href:`/explore?date=${e.ymdString}`,className:r(`relative flex aspect-square flex-col items-center justify-center rounded text-[11px] transition-colors`,e.inCurrentMonth?`text-foreground hover:bg-brand-orange-soft`:`text-muted`,s===0&&e.inCurrentMonth&&`text-status-cancelled-bg`,s===6&&e.inCurrentMonth&&`text-link`,o&&`bg-brand-orange text-white hover:bg-brand-orange-hover`),"aria-label":i?`${e.ymdString} (イベントあり)`:e.ymdString,children:[(0,l.jsx)(`span`,{children:e.day}),i&&(0,l.jsx)(`span`,{"aria-hidden":`true`,className:r(`absolute bottom-0.5 h-1 w-1 rounded-full`,o?`bg-white`:`bg-brand-orange`)})]},`${e.ymdString}-${n}`)})]})]})}var l,u,d=t((()=>{l=n(),o(),i(),u=[`日`,`月`,`火`,`水`,`木`,`金`,`土`],c.__docgenInfo={description:``,methods:[],displayName:`MiniCalendar`,props:{baseDate:{required:!1,tsType:{name:`Date`},description:`表示基準月 (デフォルトは現在月)`,defaultValue:{value:`new Date()`,computed:!1}},eventDates:{required:!0,tsType:{name:`Set`,elements:[{name:`string`}],raw:`Set<string>`},description:`開催日の Set (YYYY-MM-DD 文字列)`},className:{required:!1,tsType:{name:`string`},description:``}}}})),f=e({InSidebar:()=>S,ManyEvents:()=>b,MonthBoundary:()=>C,MonthBoundaryFeb2026:()=>w,NoEvents:()=>y,SpecificMonth:()=>x,__namedExportsOrder:()=>T,default:()=>h});function p(e,t,n){return`${e}-${String(t+1).padStart(2,`0`)}-${String(n).padStart(2,`0`)}`}var m,h,g,_,v,y,b,x,S,C,w,T,E=t((()=>{m=n(),d(),h={title:`Components/MiniCalendar`,component:c,parameters:{layout:`padded`}},g=new Date,_=g.getFullYear(),v=g.getMonth(),y={args:{eventDates:new Set}},b={args:{eventDates:new Set([p(_,v,3),p(_,v,8),p(_,v,12),p(_,v,15),p(_,v,18),p(_,v,22),p(_,v,25),p(_,v,28)])}},x={args:{baseDate:new Date(2026,5,1),eventDates:new Set([`2026-06-04`,`2026-06-11`,`2026-06-18`,`2026-06-25`])},parameters:{docs:{description:{story:`baseDate を指定すると任意の月のカレンダーを描画できる。`}}}},S={render:e=>(0,m.jsx)(`div`,{className:`w-72`,children:(0,m.jsx)(c,{...e})}),args:{eventDates:new Set([p(_,v,g.getDate()),p(_,v,g.getDate()+3),p(_,v,g.getDate()+7)])}},C={args:{baseDate:new Date(2026,4,15),eventDates:new Set([`2026-04-30`,`2026-05-01`,`2026-05-15`,`2026-05-31`,`2026-06-01`,`2026-06-02`])},parameters:{docs:{description:{story:`前月末 (4/26-4/30) と翌月頭 (6/1-6/6) のグレーアウトセルが視覚的に確認できる。`}}}},w={args:{baseDate:new Date(2026,1,1),eventDates:new Set([`2026-01-31`,`2026-02-01`,`2026-02-14`,`2026-02-28`,`2026-03-01`,`2026-03-02`])},parameters:{docs:{description:{story:`2026/02 は 1日が日曜なので前月埋めが 0 セル、月末のあとに翌月 3/1〜3/7 が翌月セルとして表示される。`}}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    eventDates: new Set<string>()
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    eventDates: new Set([ymd(year, month, 3), ymd(year, month, 8), ymd(year, month, 12), ymd(year, month, 15), ymd(year, month, 18), ymd(year, month, 22), ymd(year, month, 25), ymd(year, month, 28)])
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    baseDate: new Date(2026, 5, 1),
    // 2026年6月
    eventDates: new Set(["2026-06-04", "2026-06-11", "2026-06-18", "2026-06-25"])
  },
  parameters: {
    docs: {
      description: {
        story: "baseDate を指定すると任意の月のカレンダーを描画できる。"
      }
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-72">
      <MiniCalendar {...args} />
    </div>,
  args: {
    eventDates: new Set([ymd(year, month, today.getDate()), ymd(year, month, today.getDate() + 3), ymd(year, month, today.getDate() + 7)])
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    baseDate: new Date(2026, 4, 15),
    // 2026年5月
    eventDates: new Set(["2026-04-30",
    // 前月のイベント (グレーセル + dot)
    "2026-05-01", "2026-05-15", "2026-05-31", "2026-06-01",
    // 翌月のイベント (グレーセル + dot)
    "2026-06-02"])
  },
  parameters: {
    docs: {
      description: {
        story: "前月末 (4/26-4/30) と翌月頭 (6/1-6/6) のグレーアウトセルが視覚的に確認できる。"
      }
    }
  }
}`,...C.parameters?.docs?.source},description:{story:`月跨ぎ (前月末・翌月頭) のグレーアウトセルを直接見せるストーリー。
カバレッジ表の "MiniCalendar 月跨ぎセル 100%" の根拠ストーリー。

- 2026/05: 1日が金曜のため前月 4/26-4/30 が薄色で表示される
- 2026/02: 1日が日曜のため前月の埋めが無く、翌月の埋めが多くなるパターン`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    baseDate: new Date(2026, 1, 1),
    // 2026年2月 (1日が日曜なので前月埋めなし)
    eventDates: new Set(["2026-01-31", "2026-02-01", "2026-02-14", "2026-02-28", "2026-03-01", "2026-03-02"])
  },
  parameters: {
    docs: {
      description: {
        story: "2026/02 は 1日が日曜なので前月埋めが 0 セル、月末のあとに翌月 3/1〜3/7 が翌月セルとして表示される。"
      }
    }
  }
}`,...w.parameters?.docs?.source}}},T=[`NoEvents`,`ManyEvents`,`SpecificMonth`,`InSidebar`,`MonthBoundary`,`MonthBoundaryFeb2026`]}));E();export{S as InSidebar,b as ManyEvents,C as MonthBoundary,w as MonthBoundaryFeb2026,y as NoEvents,x as SpecificMonth,T as __namedExportsOrder,h as default,E as n,f as t};