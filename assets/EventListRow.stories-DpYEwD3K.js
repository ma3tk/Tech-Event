import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{At as a,bn as o,ct as s,o as c,t as l}from"./lucide-react-Dj6IqqEq.js";import{$t as u,Qt as d,Xt as f,en as p,t as m}from"./iframe-O2Td0HUc.js";import{n as h,t as g}from"./link-Du4AGLbo.js";import{n as _,t as v}from"./image-CwoAno1-.js";import{n as y,r as b}from"./EventStatusBadge-DA5IdZ-F.js";function x({event:e,showRank:t,compact:n=!1,className:i}){let a=e.href??`/event/${e.id}`,s=`evrow-${e.id}-title`,l=e.accepted,m=e.limit??null,g=e.group.iconUrl,v=e.group.url??`/group/${e.group.id}`;return(0,D.jsxs)(`article`,{"aria-labelledby":s,className:r(`group relative flex flex-col gap-3 bg-surface px-3 py-3 transition-colors duration-fast ease-out hover:bg-brand-orange-soft/40 sm:flex-row sm:items-center sm:gap-4`,n?`sm:py-2.5`:`sm:py-3`,i),children:[t!=null&&(0,D.jsx)(S,{rank:t}),(0,D.jsx)(`div`,{className:r(`relative shrink-0 overflow-hidden rounded bg-brand-orange-soft`,`aspect-video w-full sm:aspect-auto sm:h-[60px] sm:w-[80px]`),children:e.thumbnailUrl?(0,D.jsx)(_,{src:e.thumbnailUrl,alt:``,fill:!0,sizes:`(max-width: 640px) 100vw, 80px`,className:`object-cover`}):(0,D.jsx)(`div`,{className:`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-orange-soft to-brand-orange/20`,children:(0,D.jsx)(o,{"aria-hidden":`true`,className:`h-5 w-5 text-brand-orange opacity-50`})})}),(0,D.jsxs)(`div`,{className:`flex min-w-0 flex-1 flex-col gap-0.5`,children:[(0,D.jsxs)(`div`,{className:`flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground`,children:[(0,D.jsx)(y,{status:e.status,size:`sm`}),e.hashtags&&e.hashtags.length>0&&(0,D.jsxs)(f,{variant:`outline`,className:`max-w-[160px] truncate rounded-sm border-transparent bg-brand-orange-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-orange`,children:[`#`,e.hashtags[0]]}),g?(0,D.jsx)(h,{href:v,className:`relative z-10 flex shrink-0 items-center`,"aria-label":`${e.group.name} のページ`,children:(0,D.jsxs)(d,{className:`h-4 w-4 rounded-[2px] border border-border`,children:[(0,D.jsx)(p,{src:g,alt:``}),(0,D.jsx)(u,{className:`rounded-[2px] text-[8px]`,children:e.group.name.slice(0,1)})]})}):null,(0,D.jsx)(h,{href:v,className:`relative z-10 truncate text-link hover:text-link-hover hover:underline`,children:e.group.name})]}),(0,D.jsx)(`h3`,{id:s,className:`line-clamp-2 text-[15px] font-bold text-foreground transition-colors duration-fast ease-out group-hover:text-brand-orange sm:text-base`,children:(0,D.jsx)(h,{href:a,className:`before:absolute before:inset-0 before:content-[''] focus-visible:outline-none`,children:e.title})}),(0,D.jsxs)(`ul`,{className:`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground`,children:[(0,D.jsxs)(`li`,{className:`inline-flex items-center gap-1`,children:[(0,D.jsx)(o,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`}),(0,D.jsx)(C,{iso:e.startedAt})]}),(0,D.jsxs)(`li`,{className:`inline-flex items-center gap-1 min-w-0`,children:[(0,D.jsx)(w,{location:e.location}),(0,D.jsx)(`span`,{className:`truncate`,children:(0,D.jsx)(T,{location:e.location})})]})]})]}),(0,D.jsxs)(`div`,{className:`flex shrink-0 items-center gap-2 self-start sm:self-center`,children:[g&&(0,D.jsxs)(d,{className:`hidden h-8 w-8 rounded border border-border sm:flex`,children:[(0,D.jsx)(p,{src:g,alt:``}),(0,D.jsx)(u,{className:`rounded text-xs`,children:e.group.name.slice(0,1)})]}),(0,D.jsxs)(`div`,{className:`flex flex-col items-end whitespace-nowrap text-xs text-muted-foreground`,"aria-label":E(l,m),children:[(0,D.jsxs)(`span`,{className:`inline-flex items-center gap-1 font-semibold text-foreground`,children:[(0,D.jsx)(c,{"aria-hidden":`true`,className:`h-3.5 w-3.5`}),(0,D.jsxs)(`span`,{children:[l,m==null?``:` / ${m}`]})]}),(0,D.jsx)(`span`,{className:`text-[10px]`,children:`参加`})]})]})]})}function S({rank:e}){let t=`bg-zinc-100 text-zinc-700`;e===1?t=`bg-yellow-400 text-white`:e===2?t=`bg-zinc-400 text-white`:e===3&&(t=`bg-amber-700 text-white`);let n=e>=1&&e<=3;return(0,D.jsx)(`div`,{"aria-label":`${e}位`,className:r(`flex shrink-0 items-center justify-center self-start rounded-md font-extrabold`,`h-10 w-10 text-base sm:h-14 sm:w-14 sm:text-2xl`,t,n&&`shadow-sm`),children:e})}function C({iso:e}){let t=new Date(e);if(Number.isNaN(t.getTime()))return null;let n=[`日`,`月`,`火`,`水`,`木`,`金`,`土`][t.getDay()];return(0,D.jsx)(`time`,{dateTime:e,children:`${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)} (${n}) ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`})}function w({location:e}){return e.type===`online`?(0,D.jsx)(a,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`}):(0,D.jsx)(s,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`})}function T({location:e}){return e.type===`online`?(0,D.jsxs)(`span`,{children:[`オンライン`,e.platform?` (${e.platform})`:``]}):e.type===`hybrid`?(0,D.jsxs)(`span`,{children:[e.prefecture,` / オンライン`]}):(0,D.jsx)(`span`,{children:e.prefecture})}function E(e,t){return t==null?`参加者 ${e}人 (定員なし)`:`参加者 ${e}人、定員 ${t}人`}var D,O=t((()=>{D=n(),g(),v(),l(),i(),b(),m(),x.__docgenInfo={description:`コンパクトリスト行 (connpass の "新着イベント" や検索結果のリスト型)

- デスクトップ: 左に 80x60 サムネ → 右に "タグ + グループ名 / タイトル / 日付・会場" を縦積み
- 行右端: 参加者数 ("参加 23 / 50")
- モバイル: サムネを上、テキストを下に縦積み
- 全体クリッカブル (Stretched link)
- 行と行の区切りはコンテナ側で \`divide-y\` を使う前提だが、念のため \`border-b\` も用意

内部の小ロゴ/右端ロゴは \`ui/Avatar\` を使い、ハッシュタグ pill は \`ui/Badge\` の
装飾レイヤに乗せている。`,methods:[],displayName:`EventListRow`,props:{event:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{
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
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`name`,value:{name:`string`,required:!0}},{key:`iconUrl`,value:{name:`string`,required:!1}},{key:`url`,value:{name:`string`,required:!1}}]},required:!0}},{key:`hashtags`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!1},description:`ハッシュタグ`},{key:`href`,value:{name:`string`,required:!1},description:"詳細ページ URL。デフォルトは `/event/{id}`"}]}},description:``},showRank:{required:!1,tsType:{name:`number`},description:`順位表示。指定するとサムネ左に大きな順位バッジが表示される。
1〜3 は金/銀/銅、4 以降はシンプルな数字。`},compact:{required:!1,tsType:{name:`boolean`},description:"`true` のときさらにコンパクト(行高 ~80px)。デフォルトでも十分コンパクト。",defaultValue:{value:`false`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:``}}}})),k=e({Compact:()=>P,Default:()=>N,ListOfRows:()=>z,OnlineEvent:()=>V,Rank1:()=>F,Rank10:()=>R,Rank2:()=>I,Rank3:()=>L,Ranking:()=>B,WithThumbnail:()=>H,WithThumbnailCompact:()=>U,WithThumbnailRank1:()=>W,__namedExportsOrder:()=>G,default:()=>j}),A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K=t((()=>{A=n(),O(),j={title:`Components/EventListRow`,component:x,parameters:{layout:`padded`,docs:{description:{component:`1 行 88-96px の高密度フォーマット。検索結果 / ランキング / タイムラインの内部要素として使う。Design.md §5.4 厳格仕様準拠。

**カタログ**: [docs/catalog/03-organisms/event-list-row.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/03-organisms/event-list-row.md) — 使い分けガイド`}}},argTypes:{showRank:{control:{type:`number`,min:1}},compact:{control:`boolean`}}},M={id:`e1`,title:`第 42 回 TypeScript Meetup - 型システム再入門`,startedAt:`2026-06-15T19:00:00+09:00`,status:`open`,location:{type:`offline`,prefecture:`東京都`},accepted:23,limit:50,group:{id:`g1`,name:`TypeScript JP`,iconUrl:`https://placehold.co/40x40/ea5404/ffffff?text=TS`},hashtags:[`TypeScript`]},N={args:{event:M},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},P={args:{event:M,compact:!0},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},F={args:{event:M,showRank:1},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},I={args:{event:M,showRank:2},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},L={args:{event:M,showRank:3},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},R={args:{event:M,showRank:10},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},z={render:()=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface`,children:[{title:`React Meetup #88`,status:`open`,accepted:30,limit:50},{title:`Next.js 16 リリースパーティ`,status:`full`,accepted:100,limit:100},{title:`TypeScript x AI ワークショップ`,status:`waitlist`,accepted:80,limit:80},{title:`終了済みの過去イベント`,status:`ended`,accepted:42,limit:50}].map((e,t)=>(0,A.jsx)(x,{event:{...M,id:`e${t}`,title:e.title,status:e.status,accepted:e.accepted,limit:e.limit}},t))})},B={render:()=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface`,children:[1,2,3,4,5].map(e=>(0,A.jsx)(x,{showRank:e,event:{...M,id:`e${e}`,title:`第 ${e} 位のイベント`}},e))})},V={args:{event:{...M,location:{type:`online`,platform:`Zoom`}}},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},H={args:{event:{...M,title:`サムネイル画像ありイベント - フロントエンドカンファレンス`,thumbnailUrl:`https://picsum.photos/seed/listrow-thumb-1/640/360`}},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},U={args:{event:{...M,title:`サムネ + compact`,thumbnailUrl:`https://picsum.photos/seed/listrow-thumb-2/640/360`},compact:!0},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},W={args:{event:{...M,title:`サムネ + ランキング1位`,thumbnailUrl:`https://picsum.photos/seed/listrow-thumb-3/640/360`},showRank:1},render:e=>(0,A.jsx)(`div`,{className:`w-full max-w-3xl`,children:(0,A.jsx)(x,{...e})})},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    compact: true
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    showRank: 1
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    showRank: 2
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    showRank: 3
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    showRank: 10
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface">
      {([{
      title: "React Meetup #88",
      status: "open",
      accepted: 30,
      limit: 50
    }, {
      title: "Next.js 16 リリースパーティ",
      status: "full",
      accepted: 100,
      limit: 100
    }, {
      title: "TypeScript x AI ワークショップ",
      status: "waitlist",
      accepted: 80,
      limit: 80
    }, {
      title: "終了済みの過去イベント",
      status: "ended",
      accepted: 42,
      limit: 50
    }] as const).map((row, i) => <EventListRow key={i} event={{
      ...baseEvent,
      id: \`e\${i}\`,
      title: row.title,
      status: row.status,
      accepted: row.accepted,
      limit: row.limit
    }} />)}
    </div>
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: () => <div className="w-full max-w-3xl divide-y divide-border rounded-md border border-border bg-surface">
      {[1, 2, 3, 4, 5].map(rank => <EventListRow key={rank} showRank={rank} event={{
      ...baseEvent,
      id: \`e\${rank}\`,
      title: \`第 \${rank} 位のイベント\`
    }} />)}
    </div>
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      location: {
        type: "online",
        platform: "Zoom"
      }
    }
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      title: "サムネイル画像ありイベント - フロントエンドカンファレンス",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-1/640/360"
    }
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...H.parameters?.docs?.source},description:{story:`thumbnailUrl を指定したケース。カバレッジ表の「サムネ有 100%」の根拠ストーリー。
Picsum で安定したダミー画像を生成 (seed 固定で常に同じ画像)。`,...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      title: "サムネ + compact",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-2/640/360"
    },
    compact: true
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      title: "サムネ + ランキング1位",
      thumbnailUrl: "https://picsum.photos/seed/listrow-thumb-3/640/360"
    },
    showRank: 1
  },
  render: args => <div className="w-full max-w-3xl">
      <EventListRow {...args} />
    </div>
}`,...W.parameters?.docs?.source}}},G=[`Default`,`Compact`,`Rank1`,`Rank2`,`Rank3`,`Rank10`,`ListOfRows`,`Ranking`,`OnlineEvent`,`WithThumbnail`,`WithThumbnailCompact`,`WithThumbnailRank1`]}));K();export{P as Compact,N as Default,z as ListOfRows,V as OnlineEvent,F as Rank1,R as Rank10,I as Rank2,L as Rank3,B as Ranking,H as WithThumbnail,U as WithThumbnailCompact,W as WithThumbnailRank1,G as __namedExportsOrder,j as default,K as n,k as t};