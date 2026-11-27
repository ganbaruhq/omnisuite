import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        // Declarations need calendar-core's built types.
        dependsOn: [{ task: "build", from: "dependencies" }],
        command:
          "swc src -d dist --strip-leading-paths --ignore '**/*.test.ts,**/*.test.tsx' && tsc -p tsconfig.build.json",
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
