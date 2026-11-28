import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@omnisuite/ui/components/button";
import { Toaster, toast } from "@omnisuite/ui/components/toast";
import { IconCube } from "@tabler/icons-react";

const meta = {
  title: "React/Components/Toast",
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const TYPES = ["success", "info", "warning", "error", "loading"] as const;

export const Default: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.add({
          title: "A new update is ready",
          description: "Explore the latest workspace tools and faster exports.",
          data: { variant: "icon", icon: <IconCube /> },
          actionProps: { children: "View update" },
        })
      }
    >
      Show toast
    </Button>
  ),
};

export const Avatar: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.add({
          title: "Alex Morgan",
          description: "The collection is ready for your review. Let me know what you think!",
          data: {
            variant: "avatar",
            avatar: {
              src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
              alt: "Alex Morgan",
              fallback: "AM",
            },
            date: "2 mins ago",
          },
          actionProps: { children: "View collection" },
        })
      }
    >
      Show avatar toast
    </Button>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {TYPES.map((type) => (
        <Button
          key={type}
          variant="outline"
          onClick={() => toast.add({ type, title: `${type} toast`, description: "Sync finished." })}
        >
          {type}
        </Button>
      ))}
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.add({
          title: "Collection archived",
          actionProps: { children: "Undo", onClick: () => toast.close(id) },
        });
      }}
    >
      Archive
    </Button>
  ),
};

export const Promise: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.promise(new globalThis.Promise((resolve) => setTimeout(resolve, 2000)), {
          loading: { title: "Syncing…" },
          success: { title: "Synced", description: "1,204 records updated." },
          error: { title: "Sync failed" },
        })
      }
    >
      Sync now
    </Button>
  ),
};
