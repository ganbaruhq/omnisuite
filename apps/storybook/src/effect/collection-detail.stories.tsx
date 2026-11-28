import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserHost } from "@effect/ui/html";
import { CollectionDetail } from "./pages/collection-detail";
import { EffectMount } from "./effect-mount";

import { verifyMount } from "./verify-mount";

const meta = {
  title: "Effect/Components/Collection detail",
  component: EffectMount,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
  args: { mount: (element) => BrowserHost.mount(CollectionDetail, {}, element) },
} satisfies Meta<typeof EffectMount>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
