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
      // The calendar example builds and runs in Chromium through Playwright against the built
      // packages, so this also checks that a consumer builds through their exports.
      "test:browser": {
        command:
          "vp run -t @omnisuite/calendar-example#build && pnpm --filter @omnisuite/calendar-example test:browser",
      },
    },
  },
});
