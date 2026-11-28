import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@omnisuite/ui/components/collapsible";
import { Button } from "@omnisuite/ui/components/button";

const meta = { title: "React/Components/Collapsible" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen={false} disabled={false} className="grid w-72 gap-3">
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Collection details
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="rounded-lg border p-4 text-sm">24 components ready to use.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
export const Open: Story = {
  render: () => (
    <Collapsible defaultOpen={true} disabled={false} className="grid w-72 gap-3">
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Collection details
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="rounded-lg border p-4 text-sm">24 components ready to use.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Collapsible defaultOpen={false} disabled={true} className="grid w-72 gap-3">
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Collection details
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="rounded-lg border p-4 text-sm">24 components ready to use.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
