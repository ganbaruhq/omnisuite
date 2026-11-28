import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarExample } from "./calendar-example";

import { verifyMount } from "./verify-mount";

const meta: Meta<typeof CalendarExample> = {
  title: "Effect/Calendar/Front desk",
  component: CalendarExample,
  parameters: { layout: "fullscreen" },
  play: verifyMount,
};
export default meta;
type Story = StoryObj<typeof CalendarExample>;

export const Default: Story = {};

export const Light: Story = { globals: { theme: "light" } };
export const Dark: Story = { globals: { theme: "dark" } };
