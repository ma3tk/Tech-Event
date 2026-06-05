import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  // 公開 Storybook のブラウザタブに表示されるタイトル。
  // build 後の storybook-static/index.html の <title> にも反映される。
  managerHead: (head) => `
    ${head}
    <title>tech-event Design System — Storybook</title>
    <meta name="description" content="tech-event (connpass + Luma クローン) のデザインシステム公開カタログ。21 primitives + 18 composite + 14 MDX docs + 35 stories。" />
  `,
};

export default config;
