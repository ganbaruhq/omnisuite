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

Stories are grouped as `React/Components`, `React/Form`, `Effect/Components` and `Effect/Form`. Use the theme toolbar to switch any story between light and dark. Resize the preview to check the responsive drawer and sidebar.

Add stories under `src/*.stories.tsx`. Import components through `@omnisuite/ui/components/*`; do not duplicate their implementation here.

The component catalog has **39 paired components** (25 under Components, 14 under Form), with matching story names and content in both renderers. `catalog.browser.test.ts` checks the pairing, title groups, inherited mount plays, and absence of theme overrides. React-only Command, Fancy button, Native select, Query builder, Text morph and Empty illustration stay under `React/Components`. The former mixed Button/Group/Fancy, Input/Multiline, and Overlays examples have dedicated component files.

Autodocs follows the theme toolbar too. Open overlays use iframe previews so dialogs, sheets and popovers cannot cover the docs page.

Effect stories live under `src/effect`, import `@omnisuite/ui/effect/components/*`, and mount through `EffectMount` (`BrowserHost.mount` in a React effect, interrupted on unmount). They inherit the same theme decorator. Keep `strict` and `exactOptionalPropertyTypes` inherited from the root tsconfig.

| Story group                               | Components and behavior                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Effect/Form/New collection`              | Button, input, label, textarea, field, checkbox, switch, dialog, select, tooltip, toast                                      |
| `Effect/Components/Collection detail`     | Badge, breadcrumb, card, button group, empty, input group, kbd, layer card, page, separator, skeleton, status dot, tag, text |
| `Effect/Form/Choice controls`             | Combobox, radio group, slider, toggle, toggle group, input OTP; validation through Field                                     |
| `Effect/Components/Collection list`       | Dropdown menus, nested popover, filter Sheet, row actions                                                                    |
| `Effect/Components/Workspace shell`       | Sidebar, collapsible navigation, avatar, toolbar, all composed pages                                                         |
| `Effect/Components/Calendar front desk`   | Window loading, retry, pointer drag/resize, proposals through `onEmit`                                                       |
| `Effect/Components/Calendar housekeeping` | Keyboard editing, lazy resource pages/branches, retry                                                                        |
| `Effect/Components/Drawer`                | Swipe handle and snap points                                                                                                 |
| `Effect/Form/New collection vs React`     | Interactive React and Effect forms side by side                                                                              |

`test:browser` runs two Vitest browser projects with the same Playwright version as the calendar example: `effect-browser` preserves the original 46 behavioral tests using portable stories, plus a mount/dispose regression; `storybook` uses `@storybook/addon-vitest` to render the complete catalog and run story `play` functions. Both projects fail on Effect's logged “failed view” errors. The workspace `pnpm run check` includes both projects; no separate Storybook server is required.

Effect API differences visible in these demos: Button busy status is consumer-owned; Tag selection/removal is consumer composition; Toast avatar/date/actions and async completion are composed through provider parts and a scoped Command. Effect Sidebar supports offcanvas and left/right; React additionally has rail resizing and other collapse/visual variants. Effect Sheet supports swipe dismissal. No component implementation or React class output is changed by this catalog.
