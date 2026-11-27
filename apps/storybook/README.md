# UI Storybook

Interactive stories for `@omnisuite/ui`, using the package's real components, fonts, Tailwind styles, and theme tokens.

From the repository root:

```sh
pnpm storybook
pnpm --filter @omnisuite/storybook build
```

Development runs at http://localhost:6006. Static output is written to `apps/storybook/dist`.

Use the theme toolbar to switch between light and dark. Use the viewport toolbar to check the responsive drawer and sidebar.

Add stories under `src/*.stories.tsx`. Import components through `@omnisuite/ui/components/*`; do not duplicate their implementation here.
