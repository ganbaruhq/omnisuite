/// <reference types="vite/client" />
import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/styles.css";
import { ThemedDocsContainer } from "./docs-container";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    docs: { container: ThemedDocsContainer },
  },
  argTypes: { mount: { control: false, table: { disable: true } } },
  decorators: [
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
  ],
};

export default preview;
