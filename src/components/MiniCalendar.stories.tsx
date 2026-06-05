import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MiniCalendar from "./MiniCalendar";

const meta: Meta<typeof MiniCalendar> = {
  title: "Molecules/MiniCalendar",
  component: MiniCalendar,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof MiniCalendar>;

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth(); // 0-indexed

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const NoEvents: Story = {
  args: {
    eventDates: new Set<string>(),
  },
};

export const ManyEvents: Story = {
  args: {
    eventDates: new Set([
      ymd(year, month, 3),
      ymd(year, month, 8),
      ymd(year, month, 12),
      ymd(year, month, 15),
      ymd(year, month, 18),
      ymd(year, month, 22),
      ymd(year, month, 25),
      ymd(year, month, 28),
    ]),
  },
};

export const SpecificMonth: Story = {
  args: {
    baseDate: new Date(2026, 5, 1), // 2026年6月
    eventDates: new Set([
      "2026-06-04",
      "2026-06-11",
      "2026-06-18",
      "2026-06-25",
    ]),
  },
  parameters: {
    docs: {
      description: {
        story: "baseDate を指定すると任意の月のカレンダーを描画できる。",
      },
    },
  },
};

export const InSidebar: Story = {
  render: (args) => (
    <div className="w-72">
      <MiniCalendar {...args} />
    </div>
  ),
  args: {
    eventDates: new Set([
      ymd(year, month, today.getDate()),
      ymd(year, month, today.getDate() + 3),
      ymd(year, month, today.getDate() + 7),
    ]),
  },
};

/**
 * 月跨ぎ (前月末・翌月頭) のグレーアウトセルを直接見せるストーリー。
 * カバレッジ表の "MiniCalendar 月跨ぎセル 100%" の根拠ストーリー。
 *
 * - 2026/05: 1日が金曜のため前月 4/26-4/30 が薄色で表示される
 * - 2026/02: 1日が日曜のため前月の埋めが無く、翌月の埋めが多くなるパターン
 */
export const MonthBoundary: Story = {
  args: {
    baseDate: new Date(2026, 4, 15), // 2026年5月
    eventDates: new Set([
      "2026-04-30", // 前月のイベント (グレーセル + dot)
      "2026-05-01",
      "2026-05-15",
      "2026-05-31",
      "2026-06-01", // 翌月のイベント (グレーセル + dot)
      "2026-06-02",
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          "前月末 (4/26-4/30) と翌月頭 (6/1-6/6) のグレーアウトセルが視覚的に確認できる。",
      },
    },
  },
};

export const MonthBoundaryFeb2026: Story = {
  args: {
    baseDate: new Date(2026, 1, 1), // 2026年2月 (1日が日曜なので前月埋めなし)
    eventDates: new Set([
      "2026-01-31",
      "2026-02-01",
      "2026-02-14",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          "2026/02 は 1日が日曜なので前月埋めが 0 セル、月末のあとに翌月 3/1〜3/7 が翌月セルとして表示される。",
      },
    },
  },
};
