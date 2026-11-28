import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";

const browser = () => ({
  enabled: true,
  headless: true,
  provider: playwright(),
  instances: [{ browser: "chromium" as const }],
});

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        cacheDir: "node_modules/.vite/effect-browser",
        optimizeDeps: { include: ["storybook/test"] },
        test: {
          name: "effect-browser",
          include: ["src/effect/**/*.browser.test.ts"],
          browser: browser(),
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
      {
        extends: true,
        cacheDir: "node_modules/.vite/storybook",
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: {
          name: "storybook",
          browser: browser(),
          setupFiles: [".storybook/storybook.setup.ts"],
        },
      },
    ],
  },
});
