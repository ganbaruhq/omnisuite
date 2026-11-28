import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerBody,
} from "@omnisuite/ui/components/drawer";
import { Button } from "@omnisuite/ui/components/button";

const meta = {
  title: "React/Components/Drawer",
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <div className="p-10">
      <Drawer defaultOpen={false} showSwipeHandle>
        <DrawerTrigger disabled={false} render={<Button variant="outline" />}>
          Release notes
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>What changed this week.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Drag the handle to snap the drawer, or swipe down to close.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
export const Open: Story = {
  render: () => (
    <div className="p-10">
      <Drawer defaultOpen={true} showSwipeHandle>
        <DrawerTrigger disabled={false} render={<Button variant="outline" />}>
          Release notes
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>What changed this week.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Drag the handle to snap the drawer, or swipe down to close.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
export const Disabled: Story = {
  render: () => (
    <div className="p-10">
      <Drawer defaultOpen={false} showSwipeHandle>
        <DrawerTrigger disabled={true} render={<Button variant="outline" />}>
          Release notes
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>What changed this week.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Drag the handle to snap the drawer, or swipe down to close.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
export const WithSnapPoints: Story = {
  render: () => (
    <div className="p-10">
      <Drawer defaultOpen={true} showSwipeHandle snapPoints={[0.5, 1]}>
        <DrawerTrigger disabled={false} render={<Button variant="outline" />}>
          Release notes
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>What changed this week.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Drag the handle to snap the drawer, or swipe down to close.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
export const Right: Story = {
  render: () => (
    <div className="p-10">
      <Drawer defaultOpen={true} showSwipeHandle swipeDirection="right">
        <DrawerTrigger disabled={false} render={<Button variant="outline" />}>
          Release notes
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>What changed this week.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Drag the handle to snap the drawer, or swipe down to close.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
