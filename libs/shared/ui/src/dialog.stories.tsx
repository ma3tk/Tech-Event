import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta = {
  title: "UI/Dialog",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**設計意図**: Radix `Dialog` の薄い wrapper。modal は `<DialogContent>` 内で Portal 経由で `<body>` 直下に描画され、open 中はフォーカストラップと背景スクロールロックが効く。",
          "",
          "- 必ず `<DialogTitle>` を含めること (Radix は title が無いと dev warning を出す。SR の `aria-labelledby` が破綻)",
          "- 補足説明は `<DialogDescription>` で。Title だけだと `aria-describedby` が空になる",
          "- 閉じる手段は `<DialogClose>` (X ボタン) と Esc キーの 2 つを必ず提供",
          "- 破壊的操作 (削除確認等) は Dialog の最後の Button を `variant=destructive` にする",
          "- フルスクリーンや右からスライドする UI は Sheet (drawer) を使う。Dialog は中央モーダル専用",
          "",
          "**Anti-pattern**:",
          "- ❌ `<DialogTitle>` を `sr-only` クラスで全面非表示にする (SR 視点では OK だが、視覚障害以外のユーザーが文脈を失う)",
          "- ❌ Dialog の中に Tooltip を入れる (= Portal が二重になり z-index 戦争が起きる。Popover や説明文に置換)",
          "- ❌ 開閉状態を URL クエリで管理 (= Server Action で onClose したいケース以外は不要。`open`/`onOpenChange` で十分)",
          "- ❌ Dialog 内に長いフォームを入れる (> 1 画面分) → Sheet 又は別ページにする",
          "",
          "**カタログ**: [docs/catalog/01-atoms/dialog.md](https://github.com/findyinc/tech-event/blob/main/docs/catalog/01-atoms/dialog.md) — 使い分けガイド",
        ].join("\n"),
      },
    },
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Dialog>
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
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
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
  ),
};

export const HideClose: Story = {
  render: () => (
    <Dialog>
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
  ),
};
