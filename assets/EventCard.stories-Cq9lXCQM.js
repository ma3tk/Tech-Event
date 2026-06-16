import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./src-DPzeejvG.js";import{At as a,bn as o,ct as s,o as c,t as l}from"./lucide-react-Dj6IqqEq.js";import{Ut as u,t as d}from"./iframe-Dl0jzNl2.js";import{n as f,t as p}from"./link-Du4AGLbo.js";import{n as m,t as h}from"./image-Dbo0hSYy.js";import{n as g,r as _,t as v}from"./tokyo-date-C7xVqw07.js";import{n as y,r as b}from"./EventStatusBadge-D8_6CDnv.js";import{n as x,t as S}from"./TagPill-w5uLqW9C.js";function C({event:e,variant:t=`list`,tintColor:n,hosts:i,className:a}){let o=e.href??`/event/${e.id}`,s=`ev-${e.id}-title`,l=e.accepted,d=e.limit??null,p=e.group.iconUrl;if(t===`luma`){let t=n??null,h=t?{borderInlineStartColor:t,borderInlineStartWidth:4}:void 0;return(0,j.jsxs)(u,{role:`article`,"aria-labelledby":s,className:r(`group relative flex h-full flex-col overflow-hidden`,`rounded-2xl shadow-soft-md`,t?`border-l-4`:``,`transition-[transform,box-shadow] duration-normal ease-out`,`hover:shadow-soft-lg hover:-translate-y-1`,a),style:h,children:[(0,j.jsx)(w,{src:e.thumbnailUrl,startedAt:e.startedAt,tint:t}),(0,j.jsxs)(`div`,{className:`flex flex-1 flex-col gap-3 p-5`,children:[(0,j.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,j.jsx)(y,{status:e.status,size:`sm`}),(0,j.jsx)(`span`,{className:`text-xs text-muted-foreground`,children:(0,j.jsx)(D,{iso:e.startedAt})})]}),(0,j.jsx)(`h3`,{id:s,className:`text-lg font-bold leading-snug text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out sm:text-xl`,children:(0,j.jsx)(f,{href:o,className:`before:absolute before:inset-0 before:content-[''] before:rounded-2xl focus-visible:outline-none`,children:e.title})}),e.catchPhrase&&(0,j.jsx)(`p`,{className:`text-sm text-muted-foreground line-clamp-2`,children:e.catchPhrase}),(0,j.jsxs)(`ul`,{className:`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground`,children:[(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1.5`,children:[(0,j.jsx)(O,{location:e.location}),(0,j.jsx)(k,{location:e.location})]}),(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1.5`,"aria-label":A(l,d),children:[(0,j.jsx)(c,{"aria-hidden":`true`,className:`h-4 w-4`}),(0,j.jsxs)(`span`,{children:[l,d==null?``:`/${d}`,`人`]})]})]}),(0,j.jsxs)(`div`,{className:`mt-auto flex items-center justify-between pt-2`,children:[(0,j.jsxs)(`p`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate min-w-0`,children:[p&&(0,j.jsx)(m,{src:p,alt:``,width:18,height:18,className:`h-[18px] w-[18px] rounded object-cover`,unoptimized:p.startsWith(`/`)}),(0,j.jsx)(`span`,{className:`truncate`,children:e.group.name})]}),i&&i.length>0&&(0,j.jsx)(`ul`,{className:`relative z-10 flex items-center`,"aria-label":`主催者`,children:i.slice(0,3).map((e,t)=>(0,j.jsx)(`li`,{className:r(t>0&&`-ml-2`,`inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-orange-soft text-xs font-semibold text-brand-orange ring-2 ring-surface shadow-soft-md`),title:e.name,children:e.avatarUrl?(0,j.jsx)(m,{src:e.avatarUrl,alt:``,width:28,height:28,className:`h-full w-full object-cover`}):(0,j.jsx)(`span`,{"aria-hidden":`true`,children:e.name.slice(0,1)})},`${e.name}-${t}`))})]})]})]})}return t===`grid`?(0,j.jsxs)(u,{role:`article`,"aria-labelledby":s,className:r(`group relative flex h-full flex-col overflow-hidden`,`transition-[transform,box-shadow] duration-normal ease-out hover:shadow-md hover:-translate-y-0.5`,a),children:[(0,j.jsx)(T,{src:e.thumbnailUrl,startedAt:e.startedAt,variant:`grid`}),(0,j.jsxs)(`div`,{className:`flex flex-1 flex-col gap-2 p-4`,children:[(0,j.jsx)(`div`,{className:`flex items-center gap-2`,children:(0,j.jsx)(y,{status:e.status,size:`sm`})}),(0,j.jsxs)(`p`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate`,children:[p&&(0,j.jsx)(m,{src:p,alt:``,width:16,height:16,className:`h-4 w-4 rounded object-cover`,unoptimized:p.startsWith(`/`)}),(0,j.jsx)(`span`,{className:`truncate`,children:e.group.name})]}),(0,j.jsx)(`h3`,{id:s,className:`text-sm font-bold text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out`,children:(0,j.jsx)(f,{href:o,className:`before:absolute before:inset-0 before:content-[''] focus-visible:outline-none`,children:e.title})}),e.catchPhrase&&(0,j.jsx)(`p`,{className:`text-xs text-muted-foreground line-clamp-2`,children:e.catchPhrase}),(0,j.jsxs)(`ul`,{className:`mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground`,children:[(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1 min-w-0`,children:[(0,j.jsx)(O,{location:e.location}),(0,j.jsx)(`span`,{className:`truncate`,children:(0,j.jsx)(k,{location:e.location})})]}),(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1`,"aria-label":A(l,d),children:[(0,j.jsx)(c,{"aria-hidden":`true`,className:`h-3.5 w-3.5`}),(0,j.jsxs)(`span`,{children:[l,d==null?``:`/${d}`,`人`]})]})]})]})]}):(0,j.jsxs)(u,{role:`article`,"aria-labelledby":s,className:r(`group relative flex flex-col gap-4 p-4 sm:flex-row`,`transition-[transform,box-shadow] duration-normal ease-out hover:shadow-md hover:-translate-y-0.5`,a),children:[(0,j.jsx)(T,{src:e.thumbnailUrl,startedAt:e.startedAt,variant:`list`}),(0,j.jsxs)(`div`,{className:`flex flex-1 flex-col gap-2 min-w-0`,children:[(0,j.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,j.jsx)(y,{status:e.status,size:`sm`}),(0,j.jsx)(`span`,{className:`text-xs text-muted`,children:(0,j.jsx)(D,{iso:e.startedAt})})]}),(0,j.jsxs)(`p`,{className:`flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate`,children:[p&&(0,j.jsx)(m,{src:p,alt:``,width:16,height:16,className:`h-4 w-4 rounded object-cover`,unoptimized:p.startsWith(`/`)}),(0,j.jsx)(`span`,{className:`truncate`,children:e.group.name})]}),(0,j.jsx)(`h3`,{id:s,className:`text-base font-bold text-foreground line-clamp-2 group-hover:text-brand-orange transition-colors duration-fast ease-out`,children:(0,j.jsx)(f,{href:o,className:`before:absolute before:inset-0 before:content-[''] before:rounded-lg focus-visible:outline-none`,children:e.title})}),e.catchPhrase&&(0,j.jsx)(`p`,{className:`text-sm text-muted-foreground line-clamp-1`,children:e.catchPhrase}),(0,j.jsxs)(`ul`,{className:`mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground`,children:[(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1`,children:[(0,j.jsx)(O,{location:e.location}),(0,j.jsx)(k,{location:e.location})]}),(0,j.jsxs)(`li`,{className:`inline-flex items-center gap-1`,"aria-label":A(l,d),children:[(0,j.jsx)(c,{"aria-hidden":`true`,className:`h-3.5 w-3.5`}),(0,j.jsxs)(`span`,{children:[l,d?`/${d}`:``,`人`]})]})]}),e.hashtags&&e.hashtags.length>0&&(0,j.jsx)(`ul`,{className:`relative z-10 flex flex-wrap gap-1.5`,children:e.hashtags.slice(0,4).map(e=>(0,j.jsx)(`li`,{children:(0,j.jsx)(S,{label:e,size:`sm`,href:`/tag/${encodeURIComponent(e)}`})},e))})]})]})}function w({src:e,startedAt:t,tint:n}){return(0,j.jsxs)(`div`,{className:`relative aspect-video w-full overflow-hidden bg-brand-orange-soft`,children:[e?(0,j.jsx)(m,{src:e,alt:``,fill:!0,sizes:`(max-width: 768px) 100vw, 33vw`,className:`object-cover transition-transform duration-normal ease-out group-hover:scale-[1.03]`}):(0,j.jsx)(`div`,{className:`flex h-full w-full items-center justify-center text-brand-orange`,children:(0,j.jsx)(o,{"aria-hidden":`true`,className:`h-12 w-12 opacity-40`})}),n&&(0,j.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none absolute inset-0`,style:{background:`linear-gradient(135deg, ${n}26 0%, transparent 60%)`}}),(0,j.jsx)(`div`,{className:`absolute left-3 top-3`,children:(0,j.jsx)(E,{dateIso:t})})]})}function T({src:e,startedAt:t,variant:n}){return(0,j.jsxs)(`div`,{className:n===`list`?`relative shrink-0 overflow-hidden rounded-md bg-brand-orange-soft sm:w-60 aspect-video`:`relative aspect-video w-full overflow-hidden bg-brand-orange-soft`,children:[e?(0,j.jsx)(m,{src:e,alt:``,fill:!0,sizes:n===`list`?`(max-width: 640px) 100vw, 240px`:`(max-width: 768px) 100vw, 33vw`,className:`object-cover`}):(0,j.jsx)(`div`,{className:`flex h-full w-full items-center justify-center text-brand-orange`,children:(0,j.jsx)(o,{"aria-hidden":`true`,className:`h-10 w-10 opacity-40`})}),(0,j.jsx)(`div`,{className:`absolute left-2 top-2`,children:(0,j.jsx)(E,{dateIso:t})})]})}function E({dateIso:e}){let t=new Date(e);if(Number.isNaN(t.getTime()))return null;let n=g(t);return(0,j.jsxs)(`time`,{dateTime:e,className:`flex flex-col items-center rounded bg-surface/95 px-2 py-1 text-xs font-bold text-brand-orange shadow-sm`,children:[(0,j.jsxs)(`span`,{className:`text-[10px] leading-tight`,children:[n.month,`月`]}),(0,j.jsx)(`span`,{className:`text-base leading-tight`,children:n.day})]})}function D({iso:e}){let t=new Date(e);return Number.isNaN(t.getTime())?null:(0,j.jsx)(`time`,{dateTime:e,children:_(t)})}function O({location:e}){return e.type===`online`?(0,j.jsx)(a,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`}):(0,j.jsx)(s,{"aria-hidden":`true`,className:`h-3.5 w-3.5 shrink-0`})}function k({location:e}){return e.type===`online`?(0,j.jsxs)(`span`,{children:[`オンライン`,e.platform?` (${e.platform})`:``]}):e.type===`hybrid`?(0,j.jsxs)(`span`,{children:[e.prefecture,` / オンライン`]}):(0,j.jsx)(`span`,{children:e.prefecture})}function A(e,t){return t==null?`参加者 ${e}人 (定員なし)`:`参加者 ${e}人、定員 ${t}人`}var j,ee=t((()=>{j=n(),p(),h(),l(),i(),v(),b(),x(),d(),C.__docgenInfo={description:"イベントカード。\n\n- `list` variant: 横長カード (一覧ページの標準)\n- `grid` variant: 縦型カード (トップページのフィーチャー表示用)\n\nカード全体クリッカブルは `<Link>` の `before:absolute before:inset-0` による\nStretched link パターンで実現。タイトル下線とアウトラインのみが見た目の\nフィードバックを担う。\n\n内部は `ui/Card` をベースに、stretched link を載せるため `<article>` への\n`asChild` 相当の合成は使わず、Card primitive のクラスを React.cloneElement\n経由ではなく、独自 `<article>` に Card と同等のクラスを当てる形は取らず、\nCard 自体を `<article>` として描画させる方針 (`asChild` は Card に無いため、\n代わりに Card の base クラスを保ちつつ拡張する className を渡す)。",methods:[],displayName:`EventCard`,props:{event:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{
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
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`name`,value:{name:`string`,required:!0}},{key:`iconUrl`,value:{name:`string`,required:!1}},{key:`url`,value:{name:`string`,required:!1}}]},required:!0}},{key:`hashtags`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!1},description:`ハッシュタグ`},{key:`href`,value:{name:`string`,required:!1},description:"詳細ページ URL。デフォルトは `/event/{id}`"}]}},description:``},variant:{required:!1,tsType:{name:`union`,raw:`"list" | "grid" | "luma"`,elements:[{name:`literal`,value:`"list"`},{name:`literal`,value:`"grid"`},{name:`literal`,value:`"luma"`}]},description:"カードのレイアウト。\n- `list` (デフォルト): サムネイル左 + 本文右の横長レイアウト\n- `grid`: サムネイル上 + 本文下の縦型レイアウト (3-4 カラムグリッド用)\n- `luma`: 大判 cover image (16:9) + 余白多め + glassmorphism。\n  rounded-2xl + shadow-soft-md (Luma 風カード)。",defaultValue:{value:`"list"`,computed:!1}},tintColor:{required:!1,tsType:{name:`string`},description:"オプションの tint color (HEX)。`luma` variant では subtle gradient overlay と\n左ボーダーに反映される。設定がない場合はデフォルトの brand-orange-soft。"},hosts:{required:!1,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{ name: string; avatarUrl?: string | null }`,signature:{properties:[{key:`name`,value:{name:`string`,required:!0}},{key:`avatarUrl`,value:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}],required:!1}}]}}],raw:`{ name: string; avatarUrl?: string | null }[]`},description:`主催者アバター列 (luma variant のみ表示)。Luma 風カードでは右下にスタックを重ねる。`},className:{required:!1,tsType:{name:`string`},description:``}}}})),M=e({AllStatusesGridVariant:()=>Z,AllStatusesListVariant:()=>X,Cancelled:()=>H,Ended:()=>U,Full:()=>B,GridDefault:()=>L,GridGallery:()=>Y,Hybrid:()=>z,ListDefault:()=>I,LumaDefault:()=>K,LumaGallery:()=>J,LumaWithTint:()=>q,NoLimit:()=>G,NoThumbnail:()=>W,Online:()=>R,Waitlist:()=>V,__namedExportsOrder:()=>Q,default:()=>P}),N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$=t((()=>{N=n(),ee(),P={title:`Components/EventCard`,component:C,parameters:{layout:`padded`,docs:{description:{component:"イベントカード本体。`list` (横長 1 行) / `grid` (縦積み 16:9 サムネ) の 2 variant を持つ。詳細仕様は Design.md §5.4。\n\n**カタログ**: [docs/catalog/03-organisms/event-card.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/03-organisms/event-card.md) — 使い分けガイド (いつ使う / いつ使わない / アンチパターン)"}}},argTypes:{variant:{control:`inline-radio`,options:[`list`,`grid`,`luma`]}}},F={id:`e1`,title:`第 42 回 TypeScript Meetup - 型システム再入門`,catchPhrase:`TypeScript の型システムをゼロから学び直す勉強会。LT と懇親会あり。`,startedAt:`2026-06-15T19:00:00+09:00`,endedAt:`2026-06-15T21:30:00+09:00`,status:`open`,location:{type:`offline`,prefecture:`東京都`,address:`渋谷区`},accepted:23,limit:50,group:{id:`g1`,name:`TypeScript JP`,iconUrl:`https://placehold.co/40x40/ea5404/ffffff?text=TS`},hashtags:[`TypeScript`,`勉強会`,`渋谷`,`LT`]},I={args:{event:F,variant:`list`}},L={args:{event:F,variant:`grid`},render:e=>(0,N.jsx)(`div`,{className:`w-72`,children:(0,N.jsx)(C,{...e})})},R={args:{event:{...F,title:`オンライン LT 大会`,location:{type:`online`,platform:`Zoom`}}}},z={args:{event:{...F,title:`ハイブリッド開催 - 会場 + オンライン同時配信`,location:{type:`hybrid`,prefecture:`大阪府`}}}},B={args:{event:{...F,status:`full`,accepted:50,limit:50}}},V={args:{event:{...F,status:`waitlist`,accepted:50,limit:50}}},H={args:{event:{...F,status:`cancelled`}}},U={args:{event:{...F,status:`ended`}}},W={args:{event:{...F,thumbnailUrl:void 0}}},G={args:{event:{...F,limit:null}}},K={args:{event:{...F,thumbnailUrl:`https://placehold.co/640x360/9333ea/ffffff?text=Luma+Cover`},variant:`luma`},render:e=>(0,N.jsx)(`div`,{className:`w-[420px]`,children:(0,N.jsx)(C,{...e})})},q={args:{event:{...F,thumbnailUrl:`https://placehold.co/640x360/ec4899/ffffff?text=Tinted+Cover`},variant:`luma`,tintColor:`#ec4899`,hosts:[{name:`山田 太郎`},{name:`佐藤 花子`},{name:`鈴木 一郎`}]},render:e=>(0,N.jsx)(`div`,{className:`w-[420px]`,children:(0,N.jsx)(C,{...e})})},J={render:()=>(0,N.jsx)(`div`,{className:`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3`,children:[`#9333ea`,`#ec4899`,`#f97316`,`#06b6d4`].map((e,t)=>(0,N.jsx)(C,{variant:`luma`,tintColor:e,event:{...F,id:`luma-${t}`,title:`Luma 風 カード ${t+1}`,thumbnailUrl:`https://placehold.co/640x360/${e.slice(1)}/ffffff?text=Cover+${t+1}`},hosts:[{name:`山田 太郎`},{name:`佐藤 花子`}]},e))})},Y={render:()=>(0,N.jsx)(`div`,{className:`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`,children:[`open`,`full`,`upcoming`,`ended`,`cancelled`,`waitlist`].map((e,t)=>(0,N.jsx)(C,{variant:`grid`,event:{...F,id:`e${t}`,title:`${e} のイベント例 ${t+1}`,status:e}},e))})},X={render:()=>(0,N.jsx)(`div`,{className:`flex flex-col gap-3`,children:[`upcoming`,`open`,`full`,`waitlist`,`closed`,`cancelled`,`ended`,`ongoing`].map((e,t)=>(0,N.jsx)(C,{variant:`list`,event:{...F,id:`list-${t}`,title:`[${e}] のイベント例`,status:e}},e))})},Z={render:()=>(0,N.jsx)(`div`,{className:`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`,children:[`upcoming`,`open`,`full`,`waitlist`,`closed`,`cancelled`,`ended`,`ongoing`].map((e,t)=>(0,N.jsx)(C,{variant:`grid`,event:{...F,id:`grid-${t}`,title:`[${e}] のイベント例`,status:e}},e))})},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    variant: "list"
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    event: baseEvent,
    variant: "grid"
  },
  render: args => <div className="w-72">
      <EventCard {...args} />
    </div>
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      title: "オンライン LT 大会",
      location: {
        type: "online",
        platform: "Zoom"
      }
    }
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      title: "ハイブリッド開催 - 会場 + オンライン同時配信",
      location: {
        type: "hybrid",
        prefecture: "大阪府"
      }
    }
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      status: "full",
      accepted: 50,
      limit: 50
    }
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      status: "waitlist",
      accepted: 50,
      limit: 50
    }
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      status: "cancelled"
    }
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      status: "ended"
    }
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      thumbnailUrl: undefined
    }
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      limit: null
    }
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      thumbnailUrl: "https://placehold.co/640x360/9333ea/ffffff?text=Luma+Cover"
    },
    variant: "luma"
  },
  render: args => <div className="w-[420px]">
      <EventCard {...args} />
    </div>
}`,...K.parameters?.docs?.source},description:{story:`Luma 風 variant — 大判 cover image + 余白多め + glassmorphism。
トップページの「人気のカレンダー」/「フィーチャー枠」で利用する想定。`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    event: {
      ...baseEvent,
      thumbnailUrl: "https://placehold.co/640x360/ec4899/ffffff?text=Tinted+Cover"
    },
    variant: "luma",
    tintColor: "#ec4899",
    hosts: [{
      name: "山田 太郎"
    }, {
      name: "佐藤 花子"
    }, {
      name: "鈴木 一郎"
    }]
  },
  render: args => <div className="w-[420px]">
      <EventCard {...args} />
    </div>
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  render: () => {
    const tints = ["#9333ea", "#ec4899", "#f97316", "#06b6d4"];
    return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tints.map((tint, i) => <EventCard key={tint} variant="luma" tintColor={tint} event={{
        ...baseEvent,
        id: \`luma-\${i}\`,
        title: \`Luma 風 カード \${i + 1}\`,
        thumbnailUrl: \`https://placehold.co/640x360/\${tint.slice(1)}/ffffff?text=Cover+\${i + 1}\`
      }} hosts={[{
        name: "山田 太郎"
      }, {
        name: "佐藤 花子"
      }]} />)}
      </div>;
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(["open", "full", "upcoming", "ended", "cancelled", "waitlist"] as const).map((status, i) => <EventCard key={status} variant="grid" event={{
      ...baseEvent,
      id: \`e\${i}\`,
      title: \`\${status} のイベント例 \${i + 1}\`,
      status
    }} />)}
    </div>
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: () => {
    const statuses = ["upcoming", "open", "full", "waitlist", "closed", "cancelled", "ended", "ongoing"] as const;
    return <div className="flex flex-col gap-3">
        {statuses.map((status, i) => <EventCard key={status} variant="list" event={{
        ...baseEvent,
        id: \`list-\${i}\`,
        title: \`[\${status}] のイベント例\`,
        status
      }} />)}
      </div>;
  }
}`,...X.parameters?.docs?.source},description:{story:`全 8 status × list/grid variant の網羅ストーリー。
カバレッジ表の "EventCard status 100%" の根拠ストーリー。`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: () => {
    const statuses = ["upcoming", "open", "full", "waitlist", "closed", "cancelled", "ended", "ongoing"] as const;
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status, i) => <EventCard key={status} variant="grid" event={{
        ...baseEvent,
        id: \`grid-\${i}\`,
        title: \`[\${status}] のイベント例\`,
        status
      }} />)}
      </div>;
  }
}`,...Z.parameters?.docs?.source}}},Q=[`ListDefault`,`GridDefault`,`Online`,`Hybrid`,`Full`,`Waitlist`,`Cancelled`,`Ended`,`NoThumbnail`,`NoLimit`,`LumaDefault`,`LumaWithTint`,`LumaGallery`,`GridGallery`,`AllStatusesListVariant`,`AllStatusesGridVariant`]}));$();export{Z as AllStatusesGridVariant,X as AllStatusesListVariant,H as Cancelled,U as Ended,B as Full,L as GridDefault,Y as GridGallery,z as Hybrid,I as ListDefault,K as LumaDefault,J as LumaGallery,q as LumaWithTint,G as NoLimit,W as NoThumbnail,R as Online,V as Waitlist,Q as __namedExportsOrder,P as default,$ as n,M as t};