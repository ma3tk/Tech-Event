import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterView } from "./Footer";

/**
 * Storybook では async Server Component (`Footer`) を直接描画できないため、
 * i18n 解決後の presentational 本体 `FooterView` を対象にする
 * (cf. `Header` / `HeaderServer` の分離)。args には ja 辞書のデフォルト相当値を渡す。
 */
const TAGLINE = "エンジニアのための勉強会・イベント支援プラットフォーム";

const DEFAULT_GROUPS = [
  {
    title: "ヘルプ",
    links: [
      { label: "ご利用ガイド", href: "/guide" },
      { label: "よくある質問", href: "/faq" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
  {
    title: "サイト情報",
    links: [
      { label: "会社情報", href: "/about" },
      { label: "API", href: "/about/api" },
      { label: "料金プラン", href: "/pricing" },
      { label: "広告掲載", href: "/ad" },
    ],
  },
  {
    title: "法務・規約",
    links: [
      { label: "利用規約", href: "/terms" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "特定商取引法表示", href: "/legal/tokushoho" },
    ],
  },
];

const meta: Meta<typeof FooterView> = {
  title: "Components/Footer",
  component: FooterView,
  parameters: { layout: "fullscreen" },
  args: {
    groups: DEFAULT_GROUPS,
    copyright: "© 2026 tech-event. All rights reserved.",
    tagline: TAGLINE,
  },
};

export default meta;

type Story = StoryObj<typeof FooterView>;

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
