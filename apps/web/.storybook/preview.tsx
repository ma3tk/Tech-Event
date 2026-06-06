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
    //   4. Components (composite, alphabetical) — libs/shared/ui-composite/
    //   5. Blocks (構成パターン)
    //   *. それ以外 (= 末尾)
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
          "Components",
          "Blocks",
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
