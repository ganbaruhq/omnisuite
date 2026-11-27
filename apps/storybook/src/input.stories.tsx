import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@omnisuite/ui/components/input";
import { Textarea } from "@omnisuite/ui/components/textarea";
const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "Collection name", "aria-label": "Collection name" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "Invalid name" } };
export const Multiline: Story = {
  render: () => <Textarea aria-label="Description" placeholder="Describe your collection" />,
};
