# Omnisuite

Shared packages published to npm under the `@omnisuite` scope.

| Package                     | What it is                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| `@omnisuite/ui`             | shadcn-based React components and theme (Base UI, Tabler icons).  |
| `@omnisuite/calendar-core`  | Headless calendar and resource timeline model (Effect, Temporal). |
| `@omnisuite/calendar-react` | React bindings: the resource timeline, hosts and loading hooks.   |

`packages/` holds these published packages and two private workspace packages, which are never
published (`"private": true`):

- `packages/calendar-effect` (`@omnisuite/calendar-effect`): Effect UI bindings for
  `@omnisuite/calendar-core`, the resource timeline drawn with Effect UI. Like the Effect UI
  components under `@omnisuite/ui/effect/*`, it is workspace-only until Effect UI is released.
- `packages/calendar-sample-data` (`@omnisuite/calendar-sample-data`): the sample hostel board and
  the window and resource query clients that both calendar examples show.

`apps/` holds private tooling:

- `apps/storybook`: the `@omnisuite/ui` stories.
- `apps/calendar-example`: a showcase and browser tests for the calendar packages.
- `apps/ui-effect-example`: a showcase and browser tests for the Effect UI components and
  `@omnisuite/calendar-effect`.

`pnpm run check` runs the browser tests of both examples (`test:browser`).

## Develop

```sh
pnpm install
pnpm --filter @omnisuite/calendar-example exec playwright install chromium
pnpm run check                               # lint, typecheck, unit and browser tests
pnpm storybook                               # http://localhost:6006
pnpm --filter @omnisuite/calendar-example dev
pnpm --filter @omnisuite/ui-effect-example dev
```

Packages declare explicit version ranges rather than `catalog:`, because the platform repo
includes this repo as a git submodule inside its own pnpm workspace.

Run `pnpm --filter @omnisuite/ui lint` after changing UI source. It uses Vite+ / Oxlint
with `@shadcn/lint`; `packages/ui/.oxlintrc.json` enables `shadcn/no-raw-colors`
to require theme colors. Component and theme discovery uses `packages/ui/components.json`.
Both workspace check commands include this lint step. Configure additional policies in
the same file; available rules: https://github.com/shadcn-ui/lint#rules.

## Release

1. In each PR that changes a published package, add a changeset: `pnpm changeset`.
2. To release, run `pnpm version-packages` and commit, then run `pnpm changeset tag` and `git push --follow-tags`.
3. The Publish workflow runs on the tag and publishes every package version not yet on npm. It uses npm trusted
   publishing, so it needs no token. Each package lists `ganbaruhq/omnisuite` and `publish.yml`
   as its trusted publisher on npmjs.com.

## Consuming `@omnisuite/ui`

- Inside a workspace, the package resolves to TypeScript source in `src/`.
- When published, it resolves to the built `dist/`.
- Import `@omnisuite/ui/globals.css` once. It declares `@source` for its own components.
