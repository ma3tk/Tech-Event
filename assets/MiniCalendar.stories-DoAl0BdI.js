import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{n as a,t as o}from"./link-Du4AGLbo.js";import{n as s,t as c}from"./tokyo-date-C7xVqw07.js";function l(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function u({baseDate:e=new Date,eventDates:t,className:n}){let i=s(e),o=i.year,c=i.month-1,u=new Date(o,c,1).getDay(),p=new Date(o,c+1,0).getDate(),m=s(new Date),h=`${m.year}-${String(m.month).padStart(2,`0`)}-${String(m.day).padStart(2,`0`)}`,g=[];for(let e=0;e<u;e++){let t=new Date(o,c,e-u+1);g.push({day:t.getDate(),inCurrentMonth:!1,ymdString:l(t)})}for(let e=1;e<=p;e++)g.push({day:e,inCurrentMonth:!0,ymdString:l(new Date(o,c,e))});for(;g.length%7!=0;){let e=g[g.length-1],t=new Date(e.ymdString);t.setDate(t.getDate()+1),g.push({day:t.getDate(),inCurrentMonth:!1,ymdString:l(t)})}return(0,d.jsxs)(`section`,{"aria-label":`イベントカレンダー`,className:r(`rounded-md border border-border bg-surface p-3`,n),children:[(0,d.jsxs)(`h3`,{className:`mb-2 text-center text-sm font-bold text-foreground`,children:[o,`年`,c+1,`月`]}),(0,d.jsxs)(`div`,{className:`grid grid-cols-7 gap-px text-center text-[10px] text-muted-foreground`,children:[f.map((e,t)=>(0,d.jsx)(`div`,{className:r(`py-1 font-semibold`,t===0&&`text-status-cancelled-bg`,t===6&&`text-link`),children:e},e)),g.map((e,n)=>{let i=t.has(e.ymdString),o=e.ymdString===h,s=n%7;return(0,d.jsxs)(a,{href:`/explore?date=${e.ymdString}`,className:r(`relative flex aspect-square flex-col items-center justify-center rounded text-[11px] transition-colors`,e.inCurrentMonth?`text-foreground hover:bg-brand-orange-soft`:`text-muted`,s===0&&e.inCurrentMonth&&`text-status-cancelled-bg`,s===6&&e.inCurrentMonth&&`text-link`,o&&`bg-brand-orange text-white hover:bg-brand-orange-hover`),"aria-label":i?`${e.ymdString} (イベントあり)`:e.ymdString,children:[(0,d.jsx)(`span`,{children:e.day}),i&&(0,d.jsx)(`span`,{"aria-hidden":`true`,className:r(`absolute bottom-0.5 h-1 w-1 rounded-full`,o?`bg-white`:`bg-brand-orange`)})]},`${e.ymdString}-${n}`)})]})]})}var d,f,p=t((()=>{d=n(),o(),i(),c(),f=[`日`,`月`,`火`,`水`,`木`,`金`,`土`],u.__docgenInfo={description:``,methods:[],displayName:`MiniCalendar`,props:{baseDate:{required:!1,tsType:{name:`Date`},description:`表示基準月 (デフォルトは現在月)`,defaultValue:{value:`new Date()`,computed:!1}},eventDates:{required:!0,tsType:{name:`Set`,elements:[{name:`string`}],raw:`Set<string>`},description:`開催日の Set (YYYY-MM-DD 文字列)`},className:{required:!1,tsType:{name:`string`},description:``}}}})),m=e({InSidebar:()=>w,ManyEvents:()=>S,MonthBoundary:()=>T,MonthBoundaryFeb2026:()=>E,NoEvents:()=>x,SpecificMonth:()=>C,__namedExportsOrder:()=>D,default:()=>_});function h(e,t,n){return`${e}-${String(t+1).padStart(2,`0`)}-${String(n).padStart(2,`0`)}`}var g,_,v,y,b,x,S,C,w,T,E,D,O=t((()=>{g=n(),p(),_={title:`Components/MiniCalendar`,component:u,parameters:{layout:`padded`}},v=new Date,y=v.getFullYear(),b=v.getMonth(),x={args:{eventDates:new Set}},S={args:{eventDates:new Set([h(y,b,3),h(y,b,8),h(y,b,12),h(y,b,15),h(y,b,18),h(y,b,22),h(y,b,25),h(y,b,28)])}},C={args:{baseDate:new Date(2026,5,1),eventDates:new Set([`2026-06-04`,`2026-06-11`,`2026-06-18`,`2026-06-25`])},parameters:{docs:{description:{story:`baseDate を指定すると任意の月のカレンダーを描画できる。`}}}},w={render:e=>(0,g.jsx)(`div`,{className:`w-72`,children:(0,g.jsx)(u,{...e})}),args:{eventDates:new Set([h(y,b,v.getDate()),h(y,b,v.getDate()+3),h(y,b,v.getDate()+7)])}},T={args:{baseDate:new Date(2026,4,15),eventDates:new Set([`2026-04-30`,`2026-05-01`,`2026-05-15`,`2026-05-31`,`2026-06-01`,`2026-06-02`])},parameters:{docs:{description:{story:`前月末 (4/26-4/30) と翌月頭 (6/1-6/6) のグレーアウトセルが視覚的に確認できる。`}}}},E={args:{baseDate:new Date(2026,1,1),eventDates:new Set([`2026-01-31`,`2026-02-01`,`2026-02-14`,`2026-02-28`,`2026-03-01`,`2026-03-02`])},parameters:{docs:{description:{story:`2026/02 は 1日が日曜なので前月埋めが 0 セル、月末のあとに翌月 3/1〜3/7 が翌月セルとして表示される。`}}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    eventDates: new Set<string>()
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    eventDates: new Set([ymd(year, month, 3), ymd(year, month, 8), ymd(year, month, 12), ymd(year, month, 15), ymd(year, month, 18), ymd(year, month, 22), ymd(year, month, 25), ymd(year, month, 28)])
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-72">
      <MiniCalendar {...args} />
    </div>,
  args: {
    eventDates: new Set([ymd(year, month, today.getDate()), ymd(year, month, today.getDate() + 3), ymd(year, month, today.getDate() + 7)])
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source},description:{story:`月跨ぎ (前月末・翌月頭) のグレーアウトセルを直接見せるストーリー。
カバレッジ表の "MiniCalendar 月跨ぎセル 100%" の根拠ストーリー。

- 2026/05: 1日が金曜のため前月 4/26-4/30 が薄色で表示される
- 2026/02: 1日が日曜のため前月の埋めが無く、翌月の埋めが多くなるパターン`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D=[`NoEvents`,`ManyEvents`,`SpecificMonth`,`InSidebar`,`MonthBoundary`,`MonthBoundaryFeb2026`]}));O();export{w as InSidebar,S as ManyEvents,T as MonthBoundary,E as MonthBoundaryFeb2026,x as NoEvents,C as SpecificMonth,D as __namedExportsOrder,_ as default,O as n,m as t};