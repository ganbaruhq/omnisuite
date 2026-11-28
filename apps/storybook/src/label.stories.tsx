import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@omnisuite/ui/components/label";
import { Input } from "@omnisuite/ui/components/input";

const meta = { title: "React/Form/Label" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="label-name">Collection name</Label>
      <Input id="label-name" placeholder="Design system" />
    </div>
  ),
};
export const Disabled: Story = {
  render: () => (
    <div className="group grid w-64 gap-2" data-disabled="true">
      <Label htmlFor="label-name">Collection name</Label>
      <Input id="label-name" disabled placeholder="Design system" />
    </div>
  ),
};
