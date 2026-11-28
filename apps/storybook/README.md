# UI Storybook

The shared React and Effect UI catalog, using the package's real components, fonts, Tailwind styles, and theme tokens.

From the repository root:

```sh
pnpm storybook
pnpm --filter @omnisuite/storybook build
pnpm --filter @omnisuite/calendar-example exec playwright install chromium
pnpm --filter @omnisuite/storybook test:browser
```

Development runs at http://localhost:6006. Static output is written to `apps/storybook/dist`.

Use the theme toolbar on `Default` stories to switch between light and dark. Explicit `Light` and `Dark` stories exercise both modes in Chromium. Resize the preview to check the responsive drawer and sidebar.

Add stories under `src/*.stories.tsx`. Import components through `@omnisuite/ui/components/*`; do not duplicate their implementation here.

Effect stories live under `src/effect`, import `@omnisuite/ui/effect/components/*`, and mount through `EffectMount` (`BrowserHost.mount` in a React effect, interrupted on unmount). They inherit the same theme decorator. Keep `strict` and `exactOptionalPropertyTypes` inherited from the root tsconfig.

| Story group                        | Components and behavior                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Effect/Benchmark/New collection`  | Button, input, label, textarea, field, checkbox, switch, dialog, select, tooltip, toast                                      |
| `Effect/Collections/Detail`        | Badge, breadcrumb, card, button group, empty, input group, kbd, layer card, page, separator, skeleton, status dot, tag, text |
| `Effect/Forms/Choice controls`     | Combobox, radio group, slider, toggle, toggle group, input OTP; validation through Field                                     |
| `Effect/Collections/List`          | Dropdown menus, nested popover, filter Sheet, row actions                                                                    |
| `Effect/Workspace/Shell`           | Sidebar, collapsible navigation, avatar, toolbar, all composed pages                                                         |
| `Effect/Calendar/Front desk`       | Window loading, retry, pointer drag/resize, proposals through `onEmit`                                                       |
| `Effect/Calendar/Housekeeping`     | Keyboard editing, lazy resource pages/branches, retry                                                                        |
| `Effect/Components/Drawer`         | Swipe handle and snap points                                                                                                 |
| `Compare/Benchmark/New collection` | Interactive React and Effect forms side by side                                                                              |

`test:browser` runs two Vitest browser projects with the same Playwright version as the calendar example: `effect-browser` preserves the original 46 behavioral tests using portable stories, plus a mount/dispose regression; `storybook` uses `@storybook/addon-vitest` to render the complete catalog and run story `play` functions. Both projects fail on Effect's logged “failed view” errors. The workspace `pnpm run check` includes both projects; no separate Storybook server is required.
