import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{At as a,bn as o,ct as s,o as c,t as l}from"./lucide-react-Dj6IqqEq.js";import{$t as u,Qt as d,en as f,t as p}from"./iframe-Dl0jzNl2.js";import{n as m,t as h}from"./link-Du4AGLbo.js";import{n as g,t as _}from"./tokyo-date-C7xVqw07.js";import{n as v,r as y}from"./EventStatusBadge-D8_6CDnv.js";function b({events:e,groupByMonth:t=!0,emptyMessage:n=`イベントはありません`,heading:i,className:a,stickyTopPx:o=48}){if(e.length===0)return(0,E.jsxs)(`section`,{className:r(`w-full`,a),"data-testid":`event-timeline`,children:[i&&(0,E.jsx)(`h2`,{className:`mb-3 text-xl font-bold text-foreground`,children:i}),(0,E.jsx)(`p`,{className:`rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground`,"data-testid":`event-timeline-empty`,children:n})]});if(!t)return(0,E.jsxs)(`section`,{className:r(`w-full`,a),"data-testid":`event-timeline`,children:[i&&(0,E.jsx)(`h2`,{className:`mb-3 text-xl font-bold text-foreground`,children:i}),(0,E.jsx)(`ul`,{className:`divide-y divide-border rounded-md border border-border bg-surface`,"data-testid":`event-timeline-list`,children:e.map(e=>(0,E.jsx)(`li`,{children:(0,E.jsx)(S,{event:e})},e.id))})]});let s=x(e);return(0,E.jsxs)(`section`,{className:r(`w-full`,a),"data-testid":`event-timeline`,children:[i&&(0,E.jsx)(`h2`,{className:`mb-3 text-xl font-bold text-foreground`,children:i}),(0,E.jsx)(`div`,{className:`space-y-6`,children:s.map(e=>(0,E.jsxs)(`div`,{"data-testid":`event-timeline-month-${e.key}`,children:[(0,E.jsxs)(`h3`,{className:`sticky z-[5] -mx-2 mb-2 border-b border-border bg-background/95 px-2 py-1.5 text-sm font-semibold text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80`,style:{top:o},"data-testid":`event-timeline-month-heading`,children:[e.label,(0,E.jsxs)(`span`,{className:`ml-2 text-xs font-normal text-muted-foreground`,children:[e.events.length,` 件`]})]}),(0,E.jsx)(`ul`,{className:`divide-y divide-border rounded-md border border-border bg-surface`,children:e.events.map(e=>(0,E.jsx)(`li`,{children:(0,E.jsx)(S,{event:e})},e.id))})]},e.key))})]})}function x(e){let t=[],n=new Map;for(let r of e){let e=new Date(r.startedAt);if(Number.isNaN(e.getTime()))continue;let i=g(e),a=i.year,o=i.month,s=`${a}-${String(o).padStart(2,`0`)}`,c=`${a}年${String(o).padStart(2,`0`)}月`,l=n.get(s);l==null?(n.set(s,t.length),t.push({key:s,label:c,events:[r]})):t[l].events.push(r)}return t}function S({event:e}){let t=e.href??`/event/${e.id}`,n=g(new Date(e.startedAt)),r=n.day,i=[`日`,`月`,`火`,`水`,`木`,`金`,`土`][n.weekday],a=String(n.hour).padStart(2,`0`),s=String(n.minute).padStart(2,`0`),l=e.group.iconUrl,p=e.group.url??`/group/${e.group.id}`;return(0,E.jsxs)(`article`,{"data-testid":`timeline-row-${e.id}`,className:`group relative flex items-stretch gap-3 px-3 py-3 transition-colors hover:bg-brand-orange-soft/40 sm:gap-4`,children:[(0,E.jsxs)(`div`,{className:`flex w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-background py-1.5 text-center sm:w-14`,children:[(0,E.jsx)(`span`,{className:`text-[10px] uppercase tracking-wide text-muted-foreground`,children:i}),(0,E.jsx)(`span`,{className:`text-lg font-bold leading-none text-foreground sm:text-xl`,children:r}),(0,E.jsxs)(`span`,{className:`mt-0.5 text-[10px] text-muted-foreground`,children:[a,`:`,s]})]}),(0,E.jsxs)(`div`,{className:`flex min-w-0 flex-1 flex-col gap-0.5`,children:[(0,E.jsxs)(`div`,{className:`flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground`,children:[(0,E.jsx)(v,{status:e.status,size:`sm`}),l?(0,E.jsx)(m,{href:p,className:`relative z-10 flex shrink-0 items-center`,"aria-label":`${e.group.name} のページ`,children:(0,E.jsxs)(d,{className:`h-4 w-4 rounded-[2px] border border-border`,children:[(0,E.jsx)(f,{src:l,alt:``}),(0,E.jsx)(u,{className:`rounded-[2px] text-[8px]`,children:e.group.name.slice(0,1)})]})}):null,(0,E.jsx)(m,{href:p,className:`relative z-10 truncate text-link hover:text-link-hover hover:underline`,children:e.group.name})]}),(0,E.jsx)(`h4`,{className:`line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-brand-orange sm:text-[15px]`,children:(0,E.jsx)(m,{href:t,className:`before:absolute before:inset-0 before:content-[''] focus-visible:outline-none`,children:e.title})}),(0,E.jsxs)(`ul`,{className:`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground`,children:[(0,E.jsxs)(`li`,{className:`inline-flex items-center gap-1 min-w-0`,children:[(0,E.jsx)(C,{location:e.location}),(0,E.jsx)(`span`,{className:`truncate`,children:(0,E.jsx)(w,{location:e.location})})]}),(0,E.jsxs)(`li`,{className:`inline-flex items-center gap-1`,"aria-label":T(e.accepted,e.limit??null),children:[(0,E.jsx)(c,{"aria-hidden":`true`,className:`h-3.5 w-3.5`}),(0,E.jsxs)(`span`,{children:[e.accepted,e.limit?` / ${e.limit}`:``]})]})]})]}),(0,E.jsx)(`div`,{className:`hidden h-14 w-20 shrink-0 overflow-hidden rounded bg-brand-orange-soft sm:block`,children:e.thumbnailUrl?(0,E.jsx)(`img`,{src:e.thumbnailUrl,alt:``,loading:`lazy`,className:`h-full w-full object-cover`}):(0,E.jsx)(`div`,{className:`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-orange-soft to-brand-orange/20`,children:(0,E.jsx)(o,{"aria-hidden":`true`,className:`h-5 w-5 text-brand-orange opacity-50`})})})]})}function C({location:e}){return e.type===`online`?(0,E.jsx)(a,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`}):(0,E.jsx)(s,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`})}function w({location:e}){return e.type===`online`?(0,E.jsxs)(`span`,{children:[`オンライン`,e.platform?` (${e.platform})`:``]}):e.type===`hybrid`?(0,E.jsxs)(`span`,{children:[e.prefecture,` / オンライン`]}):(0,E.jsx)(`span`,{children:e.prefecture})}function T(e,t){return t?`参加者 ${e}人、定員 ${t}人`:`参加者 ${e}人 (定員なし)`}var E,D=t((()=>{E=n(),h(),l(),i(),_(),y(),p(),b.__docgenInfo={description:``,methods:[],displayName:`EventTimeline`,props:{events:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  id: string;
  title: string;
  catchPhrase?: string;
  /** ISO8601 開催開始日時 */
  startedAt: string;
  endedAt?: string;
  status: EventStatus;
  thumbnailUrl?: string;
  location: EventLocation;
  /** 現在の参加者数 */
  accepted: number;
  /** 定員。null/undefined は無制限 */
  limit?: number | null;
  group: EventGroup;
  /** ハッシュタグ */
  hashtags?: string[];
  /** 詳細ページ URL。デフォルトは \`/event/{id}\` */
  href?: string;
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`title`,value:{name:`string`,required:!0}},{key:`catchPhrase`,value:{name:`string`,required:!1}},{key:`startedAt`,value:{name:`string`,required:!0},description:`ISO8601 開催開始日時`},{key:`endedAt`,value:{name:`string`,required:!1}},{key:`status`,value:{name:`unknown[number]`,raw:`(typeof EVENT_STATUSES)[number]`,required:!0}},{key:`thumbnailUrl`,value:{name:`string`,required:!1}},{key:`location`,value:{name:`union`,raw:`| { type: "offline"; prefecture: string; address?: string }
| { type: "online"; platform?: string }
| { type: "hybrid"; prefecture: string; address?: string }`,elements:[{name:`signature`,type:`object`,raw:`{ type: "offline"; prefecture: string; address?: string }`,signature:{properties:[{key:`type`,value:{name:`literal`,value:`"offline"`,required:!0}},{key:`prefecture`,value:{name:`string`,required:!0}},{key:`address`,value:{name:`string`,required:!1}}]}},{name:`signature`,type:`object`,raw:`{ type: "online"; platform?: string }`,signature:{properties:[{key:`type`,value:{name:`literal`,value:`"online"`,required:!0}},{key:`platform`,value:{name:`string`,required:!1}}]}},{name:`signature`,type:`object`,raw:`{ type: "hybrid"; prefecture: string; address?: string }`,signature:{properties:[{key:`type`,value:{name:`literal`,value:`"hybrid"`,required:!0}},{key:`prefecture`,value:{name:`string`,required:!0}},{key:`address`,value:{name:`string`,required:!1}}]}}],required:!0}},{key:`accepted`,value:{name:`number`,required:!0},description:`現在の参加者数`},{key:`limit`,value:{name:`union`,raw:`number | null`,elements:[{name:`number`},{name:`null`}],required:!1},description:`定員。null/undefined は無制限`},{key:`group`,value:{name:`signature`,type:`object`,raw:`{
  id: string;
  name: string;
  iconUrl?: string;
  url?: string;
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`name`,value:{name:`string`,required:!0}},{key:`iconUrl`,value:{name:`string`,required:!1}},{key:`url`,value:{name:`string`,required:!1}}]},required:!0}},{key:`hashtags`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!1},description:`ハッシュタグ`},{key:`href`,value:{name:`string`,required:!1},description:"詳細ページ URL。デフォルトは `/event/{id}`"}]}}],raw:`EventCardData[]`},description:`表示するイベント (呼び出し側でソート済み前提)`},groupByMonth:{required:!1,tsType:{name:`boolean`},description:`月単位でグループ化するか。デフォルト true`,defaultValue:{value:`true`,computed:!1}},emptyMessage:{required:!1,tsType:{name:`string`},description:`空のときに出すメッセージ`,defaultValue:{value:`"イベントはありません"`,computed:!1}},heading:{required:!1,tsType:{name:`string`},description:`タイトル (h2 相当)。指定なしは見出しを出さない`},className:{required:!1,tsType:{name:`string`},description:`ルートの追加 className`},stickyTopPx:{required:!1,tsType:{name:`number`},description:`月見出しの sticky オフセット (px)。タブナビ等と被らないように調整可能`,defaultValue:{value:`48`,computed:!1}}}}})),O=e({Default:()=>N,Empty:()=>F,OneMonth:()=>I,WithGap:()=>P,__namedExportsOrder:()=>L,default:()=>j});function k(e,t,n={}){return{id:`e-${e}`,title:`イベント ${e} - TypeScript Meetup vol.${e}`,startedAt:t,status:`open`,location:{type:`offline`,prefecture:`東京都`},accepted:12+e,limit:50,group:M,hashtags:[`TypeScript`],...n}}var A,j,M,N,P,F,I,L,R=t((()=>{A=n(),D(),j={title:`Components/EventTimeline`,component:b,parameters:{layout:`padded`},argTypes:{groupByMonth:{control:`boolean`}}},M={id:`g1`,name:`TypeScript JP`,iconUrl:`https://placehold.co/40x40/ea5404/ffffff?text=TS`,url:`/group/tsj`},N={args:{heading:`Hosting`,events:[k(1,`2026-06-03T19:00:00+09:00`),k(2,`2026-06-12T19:30:00+09:00`,{location:{type:`online`,platform:`Zoom`},status:`full`}),k(3,`2026-06-21T13:00:00+09:00`)]},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(b,{...e})})},P={args:{heading:`Going`,events:[k(1,`2026-06-03T19:00:00+09:00`),k(2,`2026-06-30T19:30:00+09:00`),k(3,`2026-08-01T10:00:00+09:00`,{status:`upcoming`}),k(4,`2026-08-15T19:00:00+09:00`,{location:{type:`hybrid`,prefecture:`大阪府`}}),k(5,`2026-09-04T19:00:00+09:00`)]},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(b,{...e})})},F={args:{heading:`Hosted`,events:[],emptyMessage:`主催したイベントはまだありません`},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(b,{...e})})},I={args:{heading:`Materials`,events:[k(1,`2026-07-02T19:00:00+09:00`,{status:`ended`}),k(2,`2026-07-08T19:30:00+09:00`,{status:`ended`}),k(3,`2026-07-14T13:00:00+09:00`,{status:`ended`}),k(4,`2026-07-21T19:00:00+09:00`,{status:`ended`}),k(5,`2026-07-28T19:00:00+09:00`,{status:`ended`})]},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(b,{...e})})},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Hosting",
    events: [makeEvent(1, "2026-06-03T19:00:00+09:00"), makeEvent(2, "2026-06-12T19:30:00+09:00", {
      location: {
        type: "online",
        platform: "Zoom"
      },
      status: "full"
    }), makeEvent(3, "2026-06-21T13:00:00+09:00")]
  },
  render: args => <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
}`,...N.parameters?.docs?.source},description:{story:`Default: 同一月内に複数イベントが並ぶケース (2026年06月のみ)。
単一月見出しの表示確認とリスト並びの基本ケース。`,...N.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Going",
    events: [makeEvent(1, "2026-06-03T19:00:00+09:00"), makeEvent(2, "2026-06-30T19:30:00+09:00"), makeEvent(3, "2026-08-01T10:00:00+09:00", {
      status: "upcoming"
    }), makeEvent(4, "2026-08-15T19:00:00+09:00", {
      location: {
        type: "hybrid",
        prefecture: "大阪府"
      }
    }), makeEvent(5, "2026-09-04T19:00:00+09:00")]
  },
  render: args => <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
}`,...P.parameters?.docs?.source},description:{story:`WithGap: 月跨ぎ (2026年6月 → 8月、7月は空) のセクション分割を視覚的に確認。`,...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Hosted",
    events: [],
    emptyMessage: "主催したイベントはまだありません"
  },
  render: args => <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
}`,...F.parameters?.docs?.source},description:{story:`Empty: 0 件時の Empty State 表示。`,...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    heading: "Materials",
    events: [makeEvent(1, "2026-07-02T19:00:00+09:00", {
      status: "ended"
    }), makeEvent(2, "2026-07-08T19:30:00+09:00", {
      status: "ended"
    }), makeEvent(3, "2026-07-14T13:00:00+09:00", {
      status: "ended"
    }), makeEvent(4, "2026-07-21T19:00:00+09:00", {
      status: "ended"
    }), makeEvent(5, "2026-07-28T19:00:00+09:00", {
      status: "ended"
    })]
  },
  render: args => <div className="w-full max-w-3xl">
      <EventTimeline {...args} />
    </div>
}`,...I.parameters?.docs?.source},description:{story:`OneMonth: 単一月に多数のイベントが集中するケース。
月見出しに件数表示が付くことを確認。`,...I.parameters?.docs?.description}}},L=[`Default`,`WithGap`,`Empty`,`OneMonth`]}));R();export{N as Default,F as Empty,I as OneMonth,P as WithGap,L as __namedExportsOrder,j as default,R as n,O as t};