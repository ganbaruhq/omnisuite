import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@omnisuite/ui/components/avatar";
import { AVATAR_IMAGE } from "./story-data";

const meta = { title: "React/Components/Avatar" } satisfies Meta;
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
          <AvatarFallback color={color}></AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(["20", "24", "32", "40", "48", "56", "64", "72", "80"] as const).map((size) => (
        <Avatar key={size} size={size} aria-label={`Avatar ${size}`}>
          <AvatarFallback color="purple">EW</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};
export const Image: Story = {
  render: () => (
    <Avatar size="80">
      <AvatarImage src={AVATAR_IMAGE} alt="Emma Wilson" />
      <AvatarFallback color="purple">EW</AvatarFallback>
    </Avatar>
  ),
};
export const FailedImage: Story = {
  render: () => (
    <Avatar size="80" aria-label="Emma Wilson">
      <AvatarImage src="data:image/png;base64,invalid" alt="Emma Wilson" />
      <AvatarFallback color="purple">EW</AvatarFallback>
    </Avatar>
  ),
};
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      {["EW", "OR", "AM"].map((initials) => (
        <Avatar key={initials} aria-label={initials}>
          <AvatarFallback color="purple">{initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
};
