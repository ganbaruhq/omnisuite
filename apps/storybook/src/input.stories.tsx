import { editName } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@omnisuite/ui/components/input";

const meta = { title: "React/Form/Input" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: editName,
  render: () => <Input aria-label="Collection name" placeholder="Collection name" />,
};
export const Disabled: Story = {
  render: () => <Input aria-label="Collection name" placeholder="Collection name" disabled />,
};
export const Invalid: Story = {
  render: () => (
    <Input
      aria-label="Collection name"
      placeholder="Collection name"
      aria-invalid
      defaultValue="Invalid name"
    />
  ),
};
export const ReadOnly: Story = {
  render: () => (
    <Input
      aria-label="Collection name"
      placeholder="Collection name"
      readOnly
      defaultValue="Design system"
    />
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid w-64 gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <Input key={size} size={size} aria-label={size} placeholder={size} />
      ))}
    </div>
  ),
};
