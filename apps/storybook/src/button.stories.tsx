import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@omnisuite/ui/components/button";
import { ButtonGroup } from "@omnisuite/ui/components/button-group";
import { FancyButton } from "@omnisuite/ui/components/fancy-button";

const meta = {
  title: "Components/Button",
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
export const Fancy: Story = { render: () => <FancyButton>Save changes</FancyButton> };
export const Group: Story = {
  render: () => (
    <ButtonGroup aria-label="Page actions">
      <ButtonGroup>
        <Button variant="outline">Documentation</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button>Create collection</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};
