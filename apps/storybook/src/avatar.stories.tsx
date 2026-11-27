import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback } from "@omnisuite/ui/components/avatar";

const meta = { title: "Components/Avatar", component: Avatar } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TextContent: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(["gray", "yellow", "purple"] as const).map((color) => (
        <Avatar key={color} size="80" aria-label={`${color} text avatar`}>
          <AvatarFallback color={color}>EW</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

export const Placeholder: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {(["gray", "yellow", "purple"] as const).map((color) => (
        <Avatar key={color} size="80" aria-label={`${color} avatar placeholder`}>
          <AvatarFallback color={color} />
        </Avatar>
      ))}
    </div>
  ),
};
