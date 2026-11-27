import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          "swc src -d dist --strip-leading-paths --ignore '**/*.test.ts' && tsc -p tsconfig.build.json",
        cache: {
          input: [
            "src/**",
            ".swcrc",
            "tsconfig*.json",
            { pattern: "tsconfig.base.json", base: "workspace" },
          ],
          output: ["dist/**"],
        },
      },
    },
  },
});
