import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import TagPill from "./TagPill";

const meta: Meta<typeof TagPill> = {
  title: "Components/TagPill",
  component: TagPill,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "filter", "selectable", "outline"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};

export default meta;

type Story = StoryObj<typeof TagPill>;

export const Default: Story = {
  args: { label: "TypeScript" },
};

export const AsLink: Story = {
  args: { label: "React", href: "/tag/react" },
};

export const WithCount: Story = {
  args: { label: "Next.js", count: 1234, href: "/tag/nextjs" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">default</span>
        <TagPill label="TypeScript" />
        <TagPill label="React" count={42} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">outline</span>
        <TagPill label="TypeScript" variant="outline" />
        <TagPill label="React" variant="outline" count={42} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-20 text-xs text-muted-foreground">filter</span>
        <TagPill label="TypeScript" variant="filter" removable />
        <TagPill label="React" variant="filter" removable />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 bg-surface p-4">
      <TagPill label="sm" size="sm" />
      <TagPill label="md" size="md" />
      <TagPill label="lg" size="lg" />
    </div>
  ),
};

export const Selectable: Story = {
  render: () => {
    const Demo = () => {
      const [selected, setSelected] = useState<string[]>(["react"]);
      const tags = ["react", "vue", "svelte", "angular"];
      const toggle = (t: string) =>
        setSelected((prev) =>
          prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
        );
      return (
        <div className="flex flex-wrap gap-2 bg-surface p-4">
          {tags.map((t) => (
            <TagPill
              key={t}
              label={t}
              variant="selectable"
              selected={selected.includes(t)}
              onClick={() => toggle(t)}
            />
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};

export const Disabled: Story = {
  args: { label: "終了したタグ", disabled: true, href: "/tag/old" },
};

/**
 * href を渡してリンクとして描画するパターン (3 variant ぶん)。
 * カバレッジ表の "TagPill href version 100%" の根拠ストーリー。
 *
 * - default variant + href
 * - outline variant + href + count
 * - default variant + href + size=lg
 */
export const AsLinkVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-3 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          default + href
        </span>
        <TagPill label="React" href="/tag/react" />
        <TagPill label="Vue" href="/tag/vue" />
        <TagPill label="Svelte" href="/tag/svelte" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          outline + href + count
        </span>
        <TagPill
          label="TypeScript"
          href="/tag/typescript"
          variant="outline"
          count={4321}
        />
        <TagPill
          label="Python"
          href="/tag/python"
          variant="outline"
          count={2222}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-32 text-xs text-muted-foreground">
          href + size=lg
        </span>
        <TagPill label="Next.js" href="/tag/nextjs" size="lg" />
        <TagPill label="Rust" href="/tag/rust" size="lg" />
      </div>
    </div>
  ),
};
