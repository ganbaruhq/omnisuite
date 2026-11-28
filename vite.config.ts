import { defineConfig } from "vite-plus";

/** The packages the typecheck, tests and example import through their built `dist`. */
const packageBuilds = ["@omnisuite/calendar-core#build", "@omnisuite/calendar-react#build"];

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["apps/**", "**/node_modules/**"],
    passWithNoTests: true,
  },
  run: {
    tasks: {
      lint: {
        command: "vp lint && pnpm --filter @omnisuite/ui lint && vp fmt --check",
        cache: true,
      },
      typecheck: { command: "pnpm -r typecheck", dependsOn: packageBuilds },
      test: { command: "vp test run", dependsOn: packageBuilds },
      // Both catalogs run in Chromium through Playwright. The calendar example also builds
      // against package exports; Storybook covers React and the workspace Effect sources.
      "test:browser": {
        command:
          "vp run -t @omnisuite/calendar-example#build && pnpm --filter @omnisuite/calendar-example test:browser && pnpm --filter @omnisuite/storybook test:browser",
      },
    },
  },
});
