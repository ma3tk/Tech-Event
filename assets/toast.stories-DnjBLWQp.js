import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{c as a,s as o,u as s}from"./iframe-BSzhKIvM.js";var c=e({Default:()=>d,ErrorVariant:()=>m,Info:()=>g,Success:()=>p,Warning:()=>h,WithAction:()=>_,WithDescription:()=>f,__namedExportsOrder:()=>v,default:()=>u}),l,u,d,f,p,m,h,g,_,v,y=t((()=>{l=n(),a(),r(),u={title:`UI/Toast`,parameters:{layout:`centered`},decorators:[e=>(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(e,{}),(0,l.jsx)(o,{})]})]},d={render:()=>(0,l.jsx)(i,{onClick:()=>s(`イベントを保存しました`),children:`標準`})},f={render:()=>(0,l.jsx)(i,{onClick:()=>s(`保存完了`,{description:`2026/06/04 22:30 に下書きを保存しました。`}),children:`Description 付き`})},p={render:()=>(0,l.jsx)(i,{onClick:()=>s.success(`参加申し込みが完了しました`),children:`Success`})},m={render:()=>(0,l.jsx)(i,{variant:`destructive`,onClick:()=>s.error(`通信に失敗しました`),children:`Error`})},h={render:()=>(0,l.jsx)(i,{variant:`outline`,onClick:()=>s.warning(`補欠リストに登録されました`),children:`Warning`})},g={render:()=>(0,l.jsx)(i,{variant:`outline`,onClick:()=>s.info(`新しいバージョンがあります`),children:`Info`})},_={render:()=>(0,l.jsx)(i,{onClick:()=>s(`下書きを削除しました`,{action:{label:`元に戻す`,onClick:()=>s(`復元しました`)}}),children:`アクション付き`})},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Button onClick={() => toast("イベントを保存しました")}>標準</Button>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Button onClick={() => toast("保存完了", {
    description: "2026/06/04 22:30 に下書きを保存しました。"
  })}>
      Description 付き
    </Button>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Button onClick={() => toast.success("参加申し込みが完了しました")}>
      Success
    </Button>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Button variant="destructive" onClick={() => toast.error("通信に失敗しました")}>
      Error
    </Button>
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Button variant="outline" onClick={() => toast.warning("補欠リストに登録されました")}>
      Warning
    </Button>
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <Button variant="outline" onClick={() => toast.info("新しいバージョンがあります")}>
      Info
    </Button>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => <Button onClick={() => toast("下書きを削除しました", {
    action: {
      label: "元に戻す",
      onClick: () => toast("復元しました")
    }
  })}>
      アクション付き
    </Button>
}`,..._.parameters?.docs?.source}}},v=[`Default`,`WithDescription`,`Success`,`ErrorVariant`,`Warning`,`Info`,`WithAction`]}));y();export{d as Default,m as ErrorVariant,g as Info,p as Success,h as Warning,_ as WithAction,f as WithDescription,v as __namedExportsOrder,u as default,c as n,y as t};