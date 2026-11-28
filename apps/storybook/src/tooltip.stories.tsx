import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip, TooltipTrigger, TooltipContent } from "@omnisuite/ui/components/tooltip";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "React/Components/Tooltip",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={false}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="top">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
export const Open: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={true}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="top">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
export const Top: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={true}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="top">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
export const Right: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={true}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="right">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
export const Bottom: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={true}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="bottom">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
export const Left: Story = {
  render: () => (
    <div className="p-24">
      <Tooltip defaultOpen={true}>
        <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
        <TooltipContent side="left">Saves the draft</TooltipContent>
      </Tooltip>
    </div>
  ),
};
