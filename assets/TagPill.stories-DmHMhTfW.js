import{a as e,c as t,i as n}from"./preload-helper-D2yxXLVK.js";import{t as r}from"./react-DAMDAfNa.js";import{t as i}from"./jsx-runtime-Dwpk6tgA.js";import{n as a,t as o}from"./TagPill-AZJ7Ja6v.js";var s=e({AllSizes:()=>h,AllVariants:()=>m,AsLink:()=>f,AsLinkVariations:()=>v,Default:()=>d,Disabled:()=>_,Selectable:()=>g,WithCount:()=>p,__namedExportsOrder:()=>y,default:()=>u}),c,l,u,d,f,p,m,h,g,_,v,y,b=n((()=>{c=i(),l=t(r()),a(),u={title:`Components/TagPill`,component:o,parameters:{layout:`centered`},argTypes:{variant:{control:`inline-radio`,options:[`default`,`filter`,`selectable`,`outline`]},size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]}}},d={args:{label:`TypeScript`}},f={args:{label:`React`,href:`/tag/react`}},p={args:{label:`Next.js`,count:1234,href:`/tag/nextjs`}},m={render:()=>(0,c.jsxs)(`div`,{className:`flex flex-col gap-3 bg-surface p-4`,children:[(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-20 text-xs text-muted-foreground`,children:`default`}),(0,c.jsx)(o,{label:`TypeScript`}),(0,c.jsx)(o,{label:`React`,count:42})]}),(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-20 text-xs text-muted-foreground`,children:`outline`}),(0,c.jsx)(o,{label:`TypeScript`,variant:`outline`}),(0,c.jsx)(o,{label:`React`,variant:`outline`,count:42})]}),(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-20 text-xs text-muted-foreground`,children:`filter`}),(0,c.jsx)(o,{label:`TypeScript`,variant:`filter`,removable:!0}),(0,c.jsx)(o,{label:`React`,variant:`filter`,removable:!0})]})]})},h={render:()=>(0,c.jsxs)(`div`,{className:`flex items-center gap-3 bg-surface p-4`,children:[(0,c.jsx)(o,{label:`sm`,size:`sm`}),(0,c.jsx)(o,{label:`md`,size:`md`}),(0,c.jsx)(o,{label:`lg`,size:`lg`})]})},g={render:()=>(0,c.jsx)(()=>{let[e,t]=(0,l.useState)([`react`]),n=[`react`,`vue`,`svelte`,`angular`],r=e=>t(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);return(0,c.jsx)(`div`,{className:`flex flex-wrap gap-2 bg-surface p-4`,children:n.map(t=>(0,c.jsx)(o,{label:t,variant:`selectable`,selected:e.includes(t),onClick:()=>r(t)},t))})},{})},_={args:{label:`終了したタグ`,disabled:!0,href:`/tag/old`}},v={render:()=>(0,c.jsxs)(`div`,{className:`flex flex-col gap-3 bg-surface p-4`,children:[(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-32 text-xs text-muted-foreground`,children:`default + href`}),(0,c.jsx)(o,{label:`React`,href:`/tag/react`}),(0,c.jsx)(o,{label:`Vue`,href:`/tag/vue`}),(0,c.jsx)(o,{label:`Svelte`,href:`/tag/svelte`})]}),(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-32 text-xs text-muted-foreground`,children:`outline + href + count`}),(0,c.jsx)(o,{label:`TypeScript`,href:`/tag/typescript`,variant:`outline`,count:4321}),(0,c.jsx)(o,{label:`Python`,href:`/tag/python`,variant:`outline`,count:2222})]}),(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`w-32 text-xs text-muted-foreground`,children:`href + size=lg`}),(0,c.jsx)(o,{label:`Next.js`,href:`/tag/nextjs`,size:`lg`}),(0,c.jsx)(o,{label:`Rust`,href:`/tag/rust`,size:`lg`})]})]})},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    label: "TypeScript"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    label: "React",
    href: "/tag/react"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Next.js",
    count: 1234,
    href: "/tag/nextjs"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">default</span>
        <TagPill label="TypeScript" />
        <TagPill label="React" count={42} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">outline</span>
        <TagPill label="TypeScript" variant="outline" />
        <TagPill label="React" variant="outline" count={42} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">filter</span>
        <TagPill label="TypeScript" variant="filter" removable />
        <TagPill label="React" variant="filter" removable />
      </div>
    </div>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3 bg-surface p-4">
      <TagPill label="sm" size="sm" />
      <TagPill label="md" size="md" />
      <TagPill label="lg" size="lg" />
    </div>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const Demo = () => {
      const [selected, setSelected] = useState<string[]>(["react"]);
      const tags = ["react", "vue", "svelte", "angular"];
      const toggle = (t: string) => setSelected(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
      return <div className="flex flex-wrap gap-2 bg-surface p-4">
          {tags.map(t => <TagPill key={t} label={t} variant="selectable" selected={selected.includes(t)} onClick={() => toggle(t)} />)}
        </div>;
    };
    return <Demo />;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    label: "終了したタグ",
    disabled: true,
    href: "/tag/old"
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          default + href
        </span>
        <TagPill label="React" href="/tag/react" />
        <TagPill label="Vue" href="/tag/vue" />
        <TagPill label="Svelte" href="/tag/svelte" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          outline + href + count
        </span>
        <TagPill label="TypeScript" href="/tag/typescript" variant="outline" count={4321} />
        <TagPill label="Python" href="/tag/python" variant="outline" count={2222} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          href + size=lg
        </span>
        <TagPill label="Next.js" href="/tag/nextjs" size="lg" />
        <TagPill label="Rust" href="/tag/rust" size="lg" />
      </div>
    </div>
}`,...v.parameters?.docs?.source},description:{story:`href を渡してリンクとして描画するパターン (3 variant ぶん)。
カバレッジ表の "TagPill href version 100%" の根拠ストーリー。

- default variant + href
- outline variant + href + count
- default variant + href + size=lg`,...v.parameters?.docs?.description}}},y=[`Default`,`AsLink`,`WithCount`,`AllVariants`,`AllSizes`,`Selectable`,`Disabled`,`AsLinkVariations`]}));b();export{h as AllSizes,m as AllVariants,f as AsLink,v as AsLinkVariations,d as Default,_ as Disabled,g as Selectable,p as WithCount,y as __namedExportsOrder,u as default,b as n,s as t};