import { toggleNotifications } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "@omnisuite/ui/components/toggle";

const meta = { title: "React/Form/Toggle" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: toggleNotifications,
  render: () => <Toggle>Notify members</Toggle>,
};
export const Pressed: Story = { render: () => <Toggle defaultPressed>Notify members</Toggle> };
export const Disabled: Story = {
  render: () => (
    <Toggle defaultPressed disabled>
      Notify members
    </Toggle>
  ),
};
export const Invalid: Story = { render: () => <Toggle aria-invalid>Notify members</Toggle> };
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <Toggle key={size} size={size}>
          {size}
        </Toggle>
      ))}
    </div>
  ),
};
export const Outline: Story = { render: () => <Toggle variant="outline">Notify members</Toggle> };
