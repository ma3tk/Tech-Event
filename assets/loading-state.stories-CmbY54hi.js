import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{J as r,q as i}from"./iframe-BpKJYaG2.js";var a=e({Dots:()=>u,SkeletonList:()=>d,Spinner:()=>c,SpinnerLarge:()=>l,__namedExportsOrder:()=>f,default:()=>s}),o,s,c,l,u,d,f,p=t((()=>{o=n(),r(),s={title:`UI/LoadingState`,component:i,parameters:{layout:`centered`,docs:{description:{component:"ロード中の表現を `variant=spinner|skeleton|dots` で切り替える primitive。`role=status` + `aria-live=polite` で SR に通知。短時間=spinner、ページ/リスト=skeleton、継続感=dots。"}}},argTypes:{variant:{control:`inline-radio`,options:[`spinner`,`skeleton`,`dots`]},size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},skeletonRows:{control:{type:`number`,min:1,max:8}}}},c={args:{variant:`spinner`}},l={args:{variant:`spinner`,size:`lg`}},u={args:{variant:`dots`}},d={args:{variant:`skeleton`,skeletonRows:5},render:e=>(0,o.jsx)(`div`,{className:`w-80`,children:(0,o.jsx)(i,{...e})})},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "spinner"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "spinner",
    size: "lg"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "dots"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "skeleton",
    skeletonRows: 5
  },
  render: args => <div className="w-80">
      <LoadingState {...args} />
    </div>
}`,...d.parameters?.docs?.source}}},f=[`Spinner`,`SpinnerLarge`,`Dots`,`SkeletonList`]}));p();export{u as Dots,d as SkeletonList,c as Spinner,l as SpinnerLarge,f as __namedExportsOrder,s as default,a as n,p as t};