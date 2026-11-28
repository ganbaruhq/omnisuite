import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "@omnisuite/ui/components/skeleton";

const meta = { title: "React/Components/Skeleton" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <Skeleton className="h-4 w-64" /> };
export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-4" aria-label="Loading profile">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
};
