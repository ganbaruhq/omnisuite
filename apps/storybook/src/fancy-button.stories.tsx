import type { Meta, StoryObj } from "@storybook/react-vite";
import { FancyButton } from "@omnisuite/ui/components/fancy-button";
const meta = {
  title: "React/Components/Fancy button",
  component: FancyButton,
  args: { children: "Save changes" },
} satisfies Meta<typeof FancyButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <FancyButton key={variant} variant={variant}>
            {variant}
          </FancyButton>
        ),
      )}
    </div>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <FancyButton key={size} size={size}>
          {size}
        </FancyButton>
      ))}
    </div>
  ),
};
export const Disabled: Story = { args: { disabled: true } };
export const Pending: Story = { args: { status: "pending" } };
