import{a as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./jsx-runtime-Dwpk6tgA.js";import{n as r,t as i}from"./button-Cb4kPHxL.js";import{Bt as a,Ft as o,It as s,Lt as c,Mt as l,Nt as u,Pt as d,Rt as f,Y as p,Z as m,ot as h,st as g,zt as _}from"./iframe-BSzhKIvM.js";var v=e({Default:()=>x,HideClose:()=>C,WithForm:()=>S,__namedExportsOrder:()=>w,default:()=>b}),y,b,x,S,C,w,T=t((()=>{y=n(),a(),r(),m(),g(),b={title:`UI/Dialog`,parameters:{layout:`centered`,docs:{description:{component:["**設計意図**: Radix `Dialog` の薄い wrapper。modal は `<DialogContent>` 内で Portal 経由で `<body>` 直下に描画され、open 中はフォーカストラップと背景スクロールロックが効く。",``,"- 必ず `<DialogTitle>` を含めること (Radix は title が無いと dev warning を出す。SR の `aria-labelledby` が破綻)","- 補足説明は `<DialogDescription>` で。Title だけだと `aria-describedby` が空になる","- 閉じる手段は `<DialogClose>` (X ボタン) と Esc キーの 2 つを必ず提供","- 破壊的操作 (削除確認等) は Dialog の最後の Button を `variant=destructive` にする",`- フルスクリーンや右からスライドする UI は Sheet (drawer) を使う。Dialog は中央モーダル専用`,``,`**Anti-pattern**:`,"- ❌ `<DialogTitle>` を `sr-only` クラスで全面非表示にする (SR 視点では OK だが、視覚障害以外のユーザーが文脈を失う)",`- ❌ Dialog の中に Tooltip を入れる (= Portal が二重になり z-index 戦争が起きる。Popover や説明文に置換)`,"- ❌ 開閉状態を URL クエリで管理 (= Server Action で onClose したいケース以外は不要。`open`/`onOpenChange` で十分)",`- ❌ Dialog 内に長いフォームを入れる (> 1 画面分) → Sheet 又は別ページにする`,``,`**カタログ**: [docs/catalog/01-atoms/dialog.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/dialog.md) — 使い分けガイド`].join(`
`)}}}},x={render:()=>(0,y.jsxs)(l,{children:[(0,y.jsx)(_,{asChild:!0,children:(0,y.jsx)(i,{children:`開く`})}),(0,y.jsxs)(d,{children:[(0,y.jsxs)(c,{children:[(0,y.jsx)(f,{children:`イベントを削除しますか?`}),(0,y.jsx)(o,{children:`この操作は取り消せません。参加者の登録情報もすべて削除されます。`})]}),(0,y.jsxs)(s,{children:[(0,y.jsx)(u,{asChild:!0,children:(0,y.jsx)(i,{variant:`outline`,children:`キャンセル`})}),(0,y.jsx)(i,{variant:`destructive`,children:`削除する`})]})]})]})},S={render:()=>(0,y.jsxs)(l,{children:[(0,y.jsx)(_,{asChild:!0,children:(0,y.jsx)(i,{children:`プロフィール編集`})}),(0,y.jsxs)(d,{children:[(0,y.jsxs)(c,{children:[(0,y.jsx)(f,{children:`プロフィール`}),(0,y.jsx)(o,{children:`表示名とメールを更新します。`})]}),(0,y.jsxs)(`div`,{className:`grid gap-4`,children:[(0,y.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,y.jsx)(h,{htmlFor:`name`,children:`名前`}),(0,y.jsx)(p,{id:`name`,defaultValue:`山田 太郎`})]}),(0,y.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,y.jsx)(h,{htmlFor:`mail`,children:`メール`}),(0,y.jsx)(p,{id:`mail`,type:`email`,defaultValue:`taro@example.com`})]})]}),(0,y.jsxs)(s,{children:[(0,y.jsx)(u,{asChild:!0,children:(0,y.jsx)(i,{variant:`outline`,children:`キャンセル`})}),(0,y.jsx)(i,{children:`保存`})]})]})]})},C={render:()=>(0,y.jsxs)(l,{children:[(0,y.jsx)(_,{asChild:!0,children:(0,y.jsx)(i,{variant:`outline`,children:`閉じるボタンなし`})}),(0,y.jsxs)(d,{hideClose:!0,children:[(0,y.jsxs)(c,{children:[(0,y.jsx)(f,{children:`注意`}),(0,y.jsx)(o,{children:`続行するには下のボタンを押してください。`})]}),(0,y.jsx)(s,{children:(0,y.jsx)(u,{asChild:!0,children:(0,y.jsx)(i,{children:`了解`})})})]})]})},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button>開く</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントを削除しますか?</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。参加者の登録情報もすべて削除されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">キャンセル</Button>
          </DialogClose>
          <Button variant="destructive">削除する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button>プロフィール編集</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロフィール</DialogTitle>
          <DialogDescription>表示名とメールを更新します。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">名前</Label>
            <Input id="name" defaultValue="山田 太郎" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mail">メール</Label>
            <Input id="mail" type="email" defaultValue="taro@example.com" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">キャンセル</Button>
          </DialogClose>
          <Button>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">閉じるボタンなし</Button>
      </DialogTrigger>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>注意</DialogTitle>
          <DialogDescription>
            続行するには下のボタンを押してください。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>了解</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,...C.parameters?.docs?.source}}},w=[`Default`,`WithForm`,`HideClose`]}));T();export{x as Default,C as HideClose,S as WithForm,w as __namedExportsOrder,b as default,T as n,v as t};