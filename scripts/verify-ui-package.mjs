import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const fixture = await mkdtemp(join(tmpdir(), "omnisuite-ui-consumer-"));
const pnpm = process.env.npm_execpath;
assert.ok(pnpm, "Run this check with pnpm verify-ui-package.");

function run(args, cwd) {
  const nodeScript = /\.[cm]?js$/.test(pnpm);
  const result = spawnSync(
    nodeScript ? process.execPath : pnpm,
    nodeScript ? [pnpm, ...args] : args,
    {
      cwd,
      stdio: "inherit",
    },
  );
  assert.equal(result.status, 0, `Failed: pnpm ${args.join(" ")}`);
}

run(["--filter", "@omnisuite/ui", "pack", "--pack-destination", fixture], root);
const tarball = (await readdir(fixture)).find((name) => name.endsWith(".tgz"));
assert.ok(tarball);
const dependencies = { "@omnisuite/ui": `file:${join(fixture, tarball).replaceAll("\\", "/")}` };
for (const name of [
  "react",
  "react-dom",
  "@types/react",
  "@types/react-dom",
  "typescript",
  "vite",
  "@tailwindcss/vite",
]) {
  const pkg = JSON.parse(
    await readFile(
      new URL(`../apps/storybook/node_modules/${name}/package.json`, import.meta.url),
      "utf8",
    ),
  );
  dependencies[name] = pkg.name === name ? pkg.version : `npm:${pkg.name}@${pkg.version}`;
}
await writeFile(
  join(fixture, "package.json"),
  JSON.stringify({ private: true, type: "module", dependencies }),
);
await mkdir(join(fixture, "src"));
await writeFile(
  join(fixture, "index.html"),
  '<div id="root"></div><script type="module" src="/src/main.tsx"></script>',
);
await writeFile(
  join(fixture, "vite.config.mjs"),
  'import tailwindcss from "@tailwindcss/vite"; export default { plugins: [tailwindcss()], build: { minify: false } };',
);
await writeFile(join(fixture, "build.mjs"), 'import { build } from "vite"; await build();');
await writeFile(
  join(fixture, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "ES2023",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      types: ["vite/client"],
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ["src"],
  }),
);
await writeFile(
  join(fixture, "src", "styles.css"),
  '@import "@omnisuite/ui/globals.css";\n@source "./**/*.{ts,tsx}";',
);
await writeFile(
  join(fixture, "src", "main.tsx"),
  'import { createRoot } from "react-dom/client";\nimport { Button } from "@omnisuite/ui/components/button";\nimport { cn } from "@omnisuite/ui/lib/utils";\nimport { useIsMobile } from "@omnisuite/ui/hooks/use-mobile";\nimport "./styles.css";\nfunction App() { const mobile = useIsMobile(); return <Button className={cn("p-[37px]", mobile && "underline")}>Hello</Button>; }\ncreateRoot(document.getElementById("root")!).render(<App />);',
);
run(["install"], fixture);
const published = await readFile(
  join(fixture, "node_modules", "@omnisuite", "ui", "package.json"),
  "utf8",
);
assert.doesNotMatch(published, /catalog:|workspace:/);
assert.match(published, /dist\/components\/\*\.js/);
// Every peer names the versions it works with, and the Effect UI ones stay optional for React apps.
const { peerDependencies = {}, peerDependenciesMeta = {} } = JSON.parse(published);
assert.deepEqual(
  Object.entries(peerDependencies).filter(([, range]) => range === "*" || range === ""),
  [],
  "Every peer dependency must have a version range.",
);
for (const name of ["@effect/ui", "@effect/ui-kit", "effect"]) {
  assert.ok(peerDependencies[name], `${name} must stay a peer dependency.`);
  assert.equal(peerDependenciesMeta[name]?.optional, true, `${name} must stay an optional peer.`);
}
// The Effect components stay workspace-only until Effect UI has a tagged release.
const publishedExports = JSON.parse(published).exports;
assert.ok(
  !Object.keys(publishedExports).some((key) => key.startsWith("./effect")),
  "The packed package must not export the Effect components.",
);
async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
    ),
  );
  return nested.flat();
}
const packedRoot = join(fixture, "node_modules", "@omnisuite", "ui");
const effectFiles = (await listFiles(packedRoot)).filter((file) =>
  /[\\/]effect[\\/]/.test(file.slice(packedRoot.length)),
);
assert.deepEqual(effectFiles, [], "The packed package must not ship Effect files.");
run(["exec", "tsc"], fixture);
assert.equal(
  spawnSync(process.execPath, ["build.mjs"], { cwd: fixture, stdio: "inherit" }).status,
  0,
  "The packed consumer must build.",
);
const assetDir = join(fixture, "dist", "assets");
const stylesheet = (await readdir(assetDir)).find((name) => name.endsWith(".css"));
assert.ok(stylesheet);
const css = await readFile(join(assetDir, stylesheet), "utf8");
assert.match(css, /padding:\s*37px/, "Consumer utilities must be generated.");
assert.match(css, /\.inline-flex\s*\{/, "Packaged UI utilities must be generated.");
console.log(`Packed UI consumer passed. Fixture retained at ${fixture}`);
