import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@omnisuite/ui/components/sheet";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  title: "React/Components/Sheet",
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={false}>
        <SheetTrigger disabled={false} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
export const Open: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={true}>
        <SheetTrigger disabled={false} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
export const Disabled: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={false}>
        <SheetTrigger disabled={true} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
export const Top: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={true}>
        <SheetTrigger disabled={false} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
export const Bottom: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={true}>
        <SheetTrigger disabled={false} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
export const Left: Story = {
  render: () => (
    <div className="p-10">
      <Sheet defaultOpen={true}>
        <SheetTrigger disabled={false} render={<Button variant="outline" />}>
          Open sheet
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Collection details</SheetTitle>
            <SheetDescription>Additional information for this collection.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
