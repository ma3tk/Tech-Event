import type { StorybookConfig } from "@storybook/nextjs-vite";
import { createProjectGraphAsync } from "@nx/devkit";
import remarkGfm from "remark-gfm";
import path from "node:path";

/**
 * Nx workspace 上の Storybook 設定。
 *
 * `puku0x/workspace-nx-devkit-storybook` 構成を踏襲し、
 * `createProjectGraphAsync` で workspace 内のプロジェクトを取得し、
 * `tags` に `scope:shared` を含む lib (= shared-ui / shared-ui-composite 等) と
 * `apps/web` (scope:web) の stories を自動収集する。
 *
 * 個別 lib に story dir を追加するときは project.json の tags を保つだけで
 * このファイルを編集する必要はない。
 */
const buildStoriesGlob = async (): Promise<string[]> => {
  try {
    const graph = await createProjectGraphAsync();
    const repoRoot = path.resolve(__dirname, "../../..");
    const here = path.resolve(__dirname);
    const stories: string[] = [];

    for (const projectName of Object.keys(graph.nodes)) {
      const project = graph.nodes[projectName];
      if (!project) continue;
      const tags = project.data.tags ?? [];
      // shared scope の lib / app/web の stories のみを採用。
      // 他 scope (e.g. scope:web の e2e) は story を持たないので除外。
      const isShared = tags.includes("scope:shared");
      const isWebApp =
        tags.includes("scope:web") && tags.includes("type:app");
      if (!isShared && !isWebApp) continue;

      const projectRoot = path.join(repoRoot, project.data.root);
      // .storybook/main.ts からの相対パスに変換 (Storybook v8+ は absolute も許容するが、
      // 旧来構成への互換のため relative を生成)。
      const relative = path.relative(here, projectRoot).split(path.sep).join("/");
      stories.push(`${relative}/**/*.mdx`);
      stories.push(`${relative}/**/*.stories.@(js|jsx|mjs|ts|tsx)`);
    }

    return stories.length > 0
      ? stories
      : ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"];
  } catch {
    // Nx グラフ取得に失敗した場合 (e.g. devkit 未インストール) は従来挙動にフォールバック。
    return [
      "../src/**/*.mdx",
      "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
      "../../../libs/shared/**/src/**/*.mdx",
      "../../../libs/shared/**/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    ];
  }
};

const config: StorybookConfig = {
  stories: async () => buildStoriesGlob(),
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: {
        // catalog .docs.mdx は GFM パイプテーブル (| variant | 用途 | ...) を生で
        // 埋め込んでいる。MDX v3 はデフォルトで GFM を解釈しないため、remark-gfm を
        // 明示注入しないとテーブルが生テキスト ("| variant | ... |") のまま描画される。
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  managerHead: (head) => `
    ${head}
    <title>tech-event Design System — Storybook</title>
    <meta name="description" content="tech-event (connpass + Luma クローン) のデザインシステム公開カタログ。21 primitives + 18 composite + 14 MDX docs + 35 stories。" />
  `,
};

export default config;
