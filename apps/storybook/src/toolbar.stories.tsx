import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toolbar } from "@omnisuite/ui/components/toolbar";
import { Button } from "@omnisuite/ui/components/button";

const meta = { title: "React/Components/Toolbar" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Collection actions">
      <Button variant="ghost" disabled={false}>
        Refresh
      </Button>
      <Button variant="ghost" disabled>
        Archive
      </Button>
    </Toolbar>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Toolbar aria-label="Collection actions">
      <Button variant="ghost" disabled={true}>
        Refresh
      </Button>
      <Button variant="ghost" disabled>
        Archive
      </Button>
    </Toolbar>
  ),
};
