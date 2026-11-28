import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "@omnisuite/ui/components/separator";

const meta = { title: "React/Components/Separator" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Horizontal: Story = {
  render: () => (
    <div className="grid w-64 gap-4">
      Collections
      <Separator />
      Workspace
    </div>
  ),
};
export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-4">
      Collections
      <Separator orientation="vertical" />
      Workspace
    </div>
  ),
};
