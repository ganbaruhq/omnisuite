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
      // The examples build and run in Chromium through Playwright: the calendar one against the
      // built packages, so this also checks that a consumer builds through their exports, and
      // the Effect UI one against the workspace sources.
      "test:browser": {
        command:
          "vp run -t @omnisuite/calendar-example#build && pnpm --filter @omnisuite/calendar-example test:browser && vp run -t @omnisuite/ui-effect-example#build && pnpm --filter @omnisuite/ui-effect-example test:browser",
      },
    },
  },
});
