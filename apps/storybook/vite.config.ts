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
  // Prebundle the catalog before Chromium starts; late kit discovery reloads running tests.
  optimizeDeps: {
    entries: ["src/**/*.stories.tsx"],
    include: [
      "@omnisuite/ui > @base-ui/react",
      "@omnisuite/ui > @base-ui/react/avatar",
      "@omnisuite/ui > @base-ui/react/button",
      "@omnisuite/ui > @base-ui/react/checkbox",
      "@omnisuite/ui > @base-ui/react/collapsible",
      "@omnisuite/ui > @base-ui/react/dialog",
      "@omnisuite/ui > @base-ui/react/drawer",
      "@omnisuite/ui > @base-ui/react/input",
      "@omnisuite/ui > @base-ui/react/menu",
      "@omnisuite/ui > @base-ui/react/merge-props",
      "@omnisuite/ui > @base-ui/react/popover",
      "@omnisuite/ui > @base-ui/react/radio",
      "@omnisuite/ui > @base-ui/react/radio-group",
      "@omnisuite/ui > @base-ui/react/select",
      "@omnisuite/ui > @base-ui/react/separator",
      "@omnisuite/ui > @base-ui/react/slider",
      "@omnisuite/ui > @base-ui/react/switch",
      "@omnisuite/ui > @base-ui/react/toast",
      "@omnisuite/ui > @base-ui/react/toggle",
      "@omnisuite/ui > @base-ui/react/toggle-group",
      "@omnisuite/ui > @base-ui/react/tooltip",
      "@omnisuite/ui > @base-ui/react/use-render",
      "@tabler/icons-react",
      "@omnisuite/ui > cmdk",
      "@omnisuite/ui > input-otp",
      "@omnisuite/ui > react-querybuilder",
      "@storybook/addon-docs/blocks",
      "storybook/theming",
      "@effect/ui",
      "@effect/ui-kit/Avatar",
      "@effect/ui-kit/Button",
      "@effect/ui-kit/Checkbox",
      "@effect/ui-kit/Collapsible",
      "@effect/ui-kit/Combobox",
      "@effect/ui-kit/Dialog",
      "@effect/ui-kit/Drawer",
      "@effect/ui-kit/Field",
      "@effect/ui-kit/Input",
      "@effect/ui-kit/Menu",
      "@effect/ui-kit/OTPField",
      "@effect/ui-kit/Popover",
      "@effect/ui-kit/RadioGroup",
      "@effect/ui-kit/Select",
      "@effect/ui-kit/Separator",
      "@effect/ui-kit/Slider",
      "@effect/ui-kit/Switch",
      "@effect/ui-kit/Toast",
      "@effect/ui-kit/Toggle",
      "@effect/ui-kit/ToggleGroup",
      "@effect/ui-kit/Toolbar",
      "@effect/ui-kit/Tooltip",
      "@effect/ui/html",
      "storybook/test",
    ],
  },
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
