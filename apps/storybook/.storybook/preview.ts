/// <reference types="vite/client" />
import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/styles.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  decorators: [
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
  ],
};

export default preview;
