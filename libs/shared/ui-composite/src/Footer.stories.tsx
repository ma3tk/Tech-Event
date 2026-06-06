import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Organisms/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

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
  },
};

export const CustomCopyright: Story = {
  args: {
    copyright: "© 2026 ACME Inc. Built with care.",
  },
};
