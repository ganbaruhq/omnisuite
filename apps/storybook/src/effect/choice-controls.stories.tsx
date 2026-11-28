import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { ChoiceControls } from "./pages/choice-controls";
import { EffectMount } from "./effect-mount";

import { verifyMount } from "./verify-mount";

const meta = {
  title: "Effect/Form/Choice controls",
  component: EffectMount,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(ChoiceControls, {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
