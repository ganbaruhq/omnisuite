import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@omnisuite/ui/components/button";
import { Toaster, toast } from "@omnisuite/ui/components/toast";

const meta = {
  title: "Components/Toast",
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
        toast.add({ title: "Collection created", description: "Q4 pipeline is syncing now." })
      }
    >
      Show toast
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
