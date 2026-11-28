import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@omnisuite/ui/components/text";

const meta = { title: "React/Components/Text" } satisfies Meta;
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
export const Variants: Story = {
  render: () => (
    <div className="grid gap-3">
      {(
        ["body", "secondary", "success", "error", "heading", "mono", "mono-secondary"] as const
      ).map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}
        </Text>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "base", "lg"] as const).map((size) => (
        <Text key={size} size={size}>
          Body copy {size}
        </Text>
      ))}
    </div>
  ),
};
export const Truncated: Story = {
  render: () => (
    <div className="w-48">
      <Text truncate>A long collection title that truncates within its container</Text>
    </div>
  ),
};
