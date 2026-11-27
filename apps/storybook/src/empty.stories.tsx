import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@omnisuite/ui/components/empty";
import { EmptyIllustration } from "@omnisuite/ui/components/empty-illustration";
import { Button } from "@omnisuite/ui/components/button";
const meta = { title: "Components/Empty", component: Empty } satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Illustrated: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <EmptyIllustration />
        </EmptyMedia>
        <EmptyTitle>No collections yet</EmptyTitle>
        <EmptyDescription>Create a collection to organize your data.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New collection</Button>
      </EmptyContent>
    </Empty>
  ),
};
