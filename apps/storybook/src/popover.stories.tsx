import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@omnisuite/ui/components/popover";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "React/Components/Popover",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={false}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="bottom">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
export const Open: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={true}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="bottom">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
export const Top: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={true}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="top">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
export const Right: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={true}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="right">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
export const Bottom: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={true}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="bottom">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
export const Left: Story = {
  render: () => (
    <div className="p-24">
      <Popover defaultOpen={true}>
        <PopoverTrigger render={<Button variant="outline" />}>About filters</PopoverTrigger>
        <PopoverContent side="left">
          <PopoverHeader>
            <PopoverTitle>About filters</PopoverTitle>
            <PopoverDescription>Filters only change what this list shows.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
