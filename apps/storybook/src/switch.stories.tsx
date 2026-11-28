import { switchNotifications } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@omnisuite/ui/components/switch";

const meta = { title: "React/Form/Switch" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: switchNotifications,
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Switch aria-label="Notify members" />
      Notify members
    </label>
  ),
};
export const Checked: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Switch aria-label="Notify members" defaultChecked />
      Notify members
    </label>
  ),
};
export const Disabled: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Switch aria-label="Notify members" defaultChecked disabled />
      Notify members
    </label>
  ),
};
export const Invalid: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Switch aria-label="Notify members" aria-invalid />
      Notify members
    </label>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["sm", "default"] as const).map((size) => (
        <Switch key={size} size={size} aria-label={size} />
      ))}
    </div>
  ),
};
