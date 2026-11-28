import type { Meta } from "@storybook/react-vite";
import { expect, it } from "vite-plus/test";
import { verifyMount } from "./verify-mount";

type StoryModule = { readonly default: Meta; readonly [name: string]: unknown };
const effect = import.meta.glob<StoryModule>("./*.stories.tsx", { eager: true });
const react = import.meta.glob<StoryModule>("../*.stories.tsx", { eager: true });
const controls = [
  "checkbox",
  "combobox",
  "field",
  "input",
  "input-group",
  "input-otp",
  "label",
  "radio-group",
  "select",
  "slider",
  "switch",
  "textarea",
  "toggle",
  "toggle-group",
];
const components = [
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "card",
  "collapsible",
  "dialog",
  "drawer",
  "dropdown-menu",
  "empty",
  "kbd",
  "layer-card",
  "page",
  "popover",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "status-dot",
  "tag",
  "text",
  "toast",
  "toolbar",
  "tooltip",
];
const stories = (module: StoryModule) =>
  Object.keys(module)
    .filter((name) => name !== "default" && name !== "__namedExportsOrder")
    .sort();

it.for([...components, ...controls])(
  "%s has one matching story per renderer in the correct group",
  (slug) => {
    const effectModule = effect[`./${slug}.stories.tsx`];
    const reactModule = react[`../${slug}.stories.tsx`];
    expect(effectModule).toBeDefined();
    expect(reactModule).toBeDefined();
    if (!effectModule || !reactModule) return;
    const group = controls.includes(slug) ? "Form" : "Components";
    expect(effectModule.default.title).toMatch(new RegExp(`^Effect/${group}/`));
    expect(reactModule.default.title).toBe(
      effectModule.default.title?.replace("Effect/", "React/"),
    );
    expect(stories(effectModule)).toEqual(stories(reactModule));
    expect(effectModule.default.play).toBe(verifyMount);
  },
);

it("the complete catalog uses only the four groups and follows the global theme", () => {
  const titles: string[] = [];
  for (const module of [...Object.values(effect), ...Object.values(react)]) {
    expect(module.default.title).toMatch(/^(React|Effect)\/(Components|Form)\/[^/]+$/);
    expect(titles).not.toContain(module.default.title);
    titles.push(module.default.title ?? "");
    expect(stories(module)).not.toContain("Light");
    expect(stories(module)).not.toContain("Dark");
    expect(module.default.globals?.theme).toBeUndefined();
    for (const name of stories(module)) {
      const story = module[name];
      if (typeof story === "object" && story !== null && "globals" in story) {
        expect(story.globals).not.toHaveProperty("theme");
      }
    }
  }
});

it.for([
  "command",
  "fancy-button",
  "native-select",
  "query-builder",
  "text-morph",
  "empty-illustration",
])("%s stays under React/Components only", (slug) => {
  expect(react[`../${slug}.stories.tsx`]?.default.title).toMatch(/^React\/Components\//);
  expect(effect[`./${slug}.stories.tsx`]).toBeUndefined();
});
