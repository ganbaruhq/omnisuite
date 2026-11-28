import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarExample } from "./calendar-example";

import { verifyMount } from "./verify-mount";

const meta: Meta<typeof CalendarExample> = {
  title: "Effect/Components/Calendar front desk",
  component: CalendarExample,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
};
export default meta;
type Story = StoryObj<typeof CalendarExample>;

export const Default: Story = {};
