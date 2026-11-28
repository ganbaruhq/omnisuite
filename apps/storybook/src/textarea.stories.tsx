import { editDescription } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@omnisuite/ui/components/textarea";

const meta = { title: "React/Form/Textarea" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: editDescription,
  render: () => <Textarea aria-label="Description" placeholder="Describe your collection" />,
};
export const Disabled: Story = {
  render: () => (
    <Textarea aria-label="Description" placeholder="Describe your collection" disabled />
  ),
};
export const Invalid: Story = {
  render: () => (
    <Textarea
      aria-label="Description"
      placeholder="Describe your collection"
      aria-invalid
      defaultValue="Invalid name"
    />
  ),
};
export const ReadOnly: Story = {
  render: () => (
    <Textarea
      aria-label="Description"
      placeholder="Describe your collection"
      readOnly
      defaultValue="Design system"
    />
  ),
};
