# Omnisuite

Shared packages published to npm under the `@omnisuite` scope.

| Package                     | What it is                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| `@omnisuite/ui`             | shadcn-based React components and theme (Base UI, Tabler icons).  |
| `@omnisuite/calendar-core`  | Headless calendar and resource timeline model (Effect, Temporal). |
| `@omnisuite/calendar-react` | React bindings: the resource timeline, hosts and loading hooks.   |

`packages/` holds what is published; `apps/` holds private tooling:

- `apps/storybook`: the `@omnisuite/ui` stories.
- `apps/calendar-example`: a showcase and browser tests for the calendar packages.

## Develop

```sh
pnpm install
pnpm --filter @omnisuite/calendar-example exec playwright install chromium
pnpm run check                               # lint, typecheck, unit and browser tests
pnpm storybook                               # http://localhost:6006
pnpm --filter @omnisuite/calendar-example dev
```

Packages declare explicit version ranges rather than `catalog:`, because the platform repo
includes this repo as a git submodule inside its own pnpm workspace.

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
