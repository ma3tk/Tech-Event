import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{mt as n,pt as r}from"./iframe-O2Td0HUc.js";var i=e({Default:()=>o,FromErrorInstance:()=>c,NoRetry:()=>l,WithRetry:()=>s,__namedExportsOrder:()=>u,default:()=>a}),a,o,s,c,l,u,d=t((()=>{n(),a={title:`UI/ErrorState`,component:r,parameters:{layout:`centered`,docs:{description:{component:"データ取得失敗 / 例外発生時のフォールバック UI。`role=alert` で SR に即座にエラーを通知し、`retry` 関数を渡すと再試行ボタンが出る。"}}}},o={args:{error:`イベント情報の取得に失敗しました。`}},s={args:{error:`ネットワーク接続に失敗しました。`,retry:()=>{}}},c={args:{error:Error(`500 Internal Server Error`),retry:()=>{}}},l={args:{title:`アクセス権限がありません`,error:`このページを閲覧する権限がありません。管理者にお問い合わせください。`}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    error: "イベント情報の取得に失敗しました。"
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    error: "ネットワーク接続に失敗しました。",
    retry: () => {
      /* demo only */
    }
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    error: new Error("500 Internal Server Error"),
    retry: () => {
      /* demo only */
    }
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    title: "アクセス権限がありません",
    error: "このページを閲覧する権限がありません。管理者にお問い合わせください。"
  }
}`,...l.parameters?.docs?.source}}},u=[`Default`,`WithRetry`,`FromErrorInstance`,`NoRetry`]}));d();export{o as Default,c as FromErrorInstance,l as NoRetry,s as WithRetry,u as __namedExportsOrder,a as default,d as n,i as t};