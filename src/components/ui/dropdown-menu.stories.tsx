import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const meta: Meta = {
  title: "UI/DropdownMenu",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">メニューを開く</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>アカウント</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            <span>プロフィール</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            <span>設定</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithCheckboxAndRadio: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">表示設定</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>表示項目</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>キャパシティ</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>主催者</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>タグ</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>並び順</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="date">
          <DropdownMenuRadioItem value="date">日付順</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="popular">人気順</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="new">新着順</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">共有</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>リンクをコピー</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>SNS で共有</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>X (Twitter)</DropdownMenuItem>
            <DropdownMenuItem>Facebook</DropdownMenuItem>
            <DropdownMenuItem>LinkedIn</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>QR コード</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
