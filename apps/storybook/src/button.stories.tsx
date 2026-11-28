import { IconCheck } from "@tabler/icons-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  title: "React/Components/Button",
  component: Button,
  args: { children: "Save changes" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ),
      )}
    </div>
  ),
};
export const Disabled: Story = { args: { disabled: true } };
export const Pending: Story = { args: { status: "pending" } };
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "default", "md", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"] as const).map(
        (size) => (
          <Button key={size} size={size} aria-label={size}>
            {size.startsWith("icon") ? <IconCheck /> : size}
          </Button>
        ),
      )}
    </div>
  ),
};
