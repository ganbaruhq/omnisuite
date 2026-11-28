import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "@omnisuite/ui/components/slider";

const meta = { title: "React/Form/Slider" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Slider
      className="w-72"
      aria-label="Capacity"
      defaultValue={[40]}
      disabled={false}
      orientation="horizontal"
    />
  ),
};
export const Range: Story = {
  render: () => (
    <Slider
      className="w-72"
      aria-label="Capacity"
      defaultValue={[20, 80]}
      disabled={false}
      orientation="horizontal"
    />
  ),
};
export const Disabled: Story = {
  render: () => (
    <Slider
      className="w-72"
      aria-label="Capacity"
      defaultValue={[40]}
      disabled={true}
      orientation="horizontal"
    />
  ),
};
export const Vertical: Story = {
  render: () => (
    <Slider
      className="h-48"
      aria-label="Capacity"
      defaultValue={[40]}
      disabled={false}
      orientation="vertical"
    />
  ),
};
