import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@omnisuite/ui/components/empty";
import { Button } from "@omnisuite/ui/components/button";

const meta = { title: "React/Components/Empty" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No collections yet</EmptyTitle>
        <EmptyDescription>Create a collection to organize your data.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New collection</Button>
      </EmptyContent>
    </Empty>
  ),
};
export const Icon: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">+</EmptyMedia>
        <EmptyTitle>No collections yet</EmptyTitle>
        <EmptyDescription>Create a collection to organize your data.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New collection</Button>
      </EmptyContent>
    </Empty>
  ),
};
export const WithoutAction: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No collections yet</EmptyTitle>
        <EmptyDescription>Create a collection to organize your data.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
