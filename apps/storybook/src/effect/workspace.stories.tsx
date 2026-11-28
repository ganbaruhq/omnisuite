import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { App } from "./app";
import { EffectMount } from "./effect-mount";

import { verifyMount } from "./verify-mount";

const meta = {
  title: "Effect/Components/Workspace shell",
  component: EffectMount,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(App, {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
