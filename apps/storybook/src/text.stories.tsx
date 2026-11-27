import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@omnisuite/ui/components/text";
const meta = { title: "Foundations/Typography", component: Text } satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text as="h1" variant="heading" size="lg">
        Page heading
      </Text>
      <Text as="h2" variant="heading">
        Section heading
      </Text>
      <Text>Body copy for your interface.</Text>
      <Text variant="secondary">Secondary copy and descriptions.</Text>
      <Text variant="mono">collection_id</Text>
    </div>
  ),
};
