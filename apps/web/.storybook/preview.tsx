import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import { TooltipProvider } from "@tech-event/shared-ui";

// Tailwind v4 トークン + ベーススタイル + タイポグラフィスケールを読み込む
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "page",
      values: [
        { name: "page", value: "#f7f7f5" }, // --background
        { name: "surface", value: "#ffffff" }, // --surface
        { name: "dark", value: "#1a1a1a" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' = show a11y violations in the test UI only
      // 'error' = fail CI on a11y violations
      test: "todo",
    },
    // Sidebar order (shadcn/ui スタイル分類):
    //   1. Welcome (top, landing page)
    //   2. Design System (Introduction → Tokens → Colors → ...)
    //   3. UI (primitives, alphabetical) — libs/shared/ui/
    //         各 component で Docs (MDX) を最上位、続いて Default / Variants / All*。
    //   4. Components (composite, alphabetical) — libs/shared/ui-composite/
    //   5. Blocks (構成パターン) — apps/web/src/stories/blocks/*.mdx
    //   6. Foundations (states / responsive / voice-and-tone) — apps/web/src/stories/foundations/*.mdx
    //   *. それ以外 (= 末尾)
    //
    // Per-component story order: "Docs" を最上位に固定し、続いて Default →
    // 代表的 variant → All* → 残り。これにより MDX を開けば言語化 + Canvas
    // を 1 ページで読める。
    options: {
      storySort: {
        order: [
          "Welcome",
          [
            "Design System",
            [
              "Introduction",
              "Tokens",
              "Colors",
              "Typography",
              "Spacing",
              "Radius, Shadow, Z-index",
              "Motion",
              "Icons",
              "Components",
              "Accessibility",
              "Dark Mode",
              "High Contrast",
              "RTL",
              "Print",
              "Data Viz",
              "Empty States",
              "Toast",
              "Theme Builder",
              "Component Checklist",
              "Component Status",
            ],
          ],
          "UI",
          ["*", ["Docs", "Default", "Secondary", "Destructive", "Outline", "Ghost", "Link", "AllVariants", "AllSizes", "*"]],
          "Components",
          ["*", ["Docs", "Default", "AllStatuses", "AllVariants", "AllSizes", "*"]],
          "Blocks",
          "Foundations",
          "*",
        ],
      },
    },
  },
  // すべてのストーリーを TooltipProvider で包む。
  // (Header / ParticipantBadge / HostAvatarStack 等が Radix Tooltip に依存)
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={150}>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
