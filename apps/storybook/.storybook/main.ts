import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
  framework: "@storybook/react-vite",
  typescript: { reactDocgen: "react-docgen" },
  async viteFinal(config) {
    return { ...config, plugins: [...(config.plugins ?? []), tailwindcss()] };
  },
};

export default config;
