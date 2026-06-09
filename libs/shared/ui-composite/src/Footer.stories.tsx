import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterView } from "./Footer";

/**
 * Footer は Async Server Component (`loadDict()` を await) なので、
 * Storybook では同期版の `FooterView` を直接レンダリングする。
 * 本番 Footer は default export 経由でこの `FooterView` をラップしている。
 */
const meta: Meta<typeof FooterView> = {
  title: "Components/Footer",
  component: FooterView,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof FooterView>;

const defaultGroups = [
  {
    title: "ヘルプ",
    links: [
      { label: "ガイド", href: "/guide" },
      { label: "FAQ", href: "/faq" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
  {
    title: "サイト情報",
    links: [
      { label: "運営会社", href: "/about" },
      { label: "API", href: "/about/api" },
      { label: "料金プラン", href: "/pricing" },
      { label: "広告掲載", href: "/ad" },
    ],
  },
  {
    title: "法的情報",
    links: [
      { label: "利用規約", href: "/terms" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "特定商取引法", href: "/legal/tokushoho" },
    ],
  },
];

export const Default: Story = {
  args: {
    groups: defaultGroups,
    copyright: `© ${new Date().getFullYear()} tech-event`,
    tagline: "技術コミュニティのためのイベントプラットフォーム",
  },
};

export const CustomGroups: Story = {
  args: {
    groups: [
      {
        title: "サポート",
        links: [
          { label: "FAQ", href: "/faq" },
          { label: "お問い合わせ", href: "/contact" },
        ],
      },
      {
        title: "開発者向け",
        links: [
          { label: "API ドキュメント", href: "https://api.example.com", external: true },
          { label: "ステータス", href: "https://status.example.com", external: true },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} tech-event`,
    tagline: "技術コミュニティのためのイベントプラットフォーム",
  },
};

export const CustomCopyright: Story = {
  args: {
    groups: defaultGroups,
    copyright: "© 2026 ACME Inc. Built with care.",
    tagline: "技術コミュニティのためのイベントプラットフォーム",
  },
};
