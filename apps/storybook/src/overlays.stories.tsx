import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@omnisuite/ui/components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@omnisuite/ui/components/dialog";
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
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@omnisuite/ui/components/drawer";
import { useIsMobile } from "@omnisuite/ui/hooks/use-mobile";
const meta = { title: "React/Components/Overlays" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const DialogExample: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm changes</DialogTitle>
          <DialogDescription>Review your changes before continuing.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Confirm</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
export const SheetExample: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
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
  ),
};
function ResponsiveDrawer() {
  const isMobile = useIsMobile();
  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>New collection</DrawerTitle>
          <DrawerDescription>Right on desktop, bottom with a handle on mobile.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
export const DrawerExample: Story = { render: () => <ResponsiveDrawer /> };
