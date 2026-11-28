import { checkNotifications } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@omnisuite/ui/components/checkbox";

const meta = { title: "React/Form/Checkbox" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: checkNotifications,
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox aria-label="Notify members" />
      Notify members
    </label>
  ),
};
export const Checked: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox aria-label="Notify members" defaultChecked />
      Notify members
    </label>
  ),
};
export const Disabled: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox aria-label="Notify members" defaultChecked disabled />
      Notify members
    </label>
  ),
};
export const Invalid: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox aria-label="Notify members" aria-invalid />
      Notify members
    </label>
  ),
};
export const Indeterminate: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox aria-label="Notify members" indeterminate />
      Notify members
    </label>
  ),
};
