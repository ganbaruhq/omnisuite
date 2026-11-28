import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "@omnisuite/ui/components/kbd";

const meta = { title: "React/Components/Kbd" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <Kbd>⌘</Kbd> };
export const Shortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>+<Kbd>K</Kbd>
    </KbdGroup>
  ),
};
