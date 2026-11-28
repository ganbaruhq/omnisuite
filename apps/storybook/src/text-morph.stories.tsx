import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TextMorph } from "@omnisuite/ui/components/text-morph";
import { Button } from "@omnisuite/ui/components/button";
const meta = { title: "React/Components/Text morph" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function MorphDemo({ direction = "up" }: { direction?: "up" | "down" }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <TextMorph direction={direction}>{saved ? "Saved" : "Save changes"}</TextMorph>
      <Button variant="outline" onClick={() => setSaved((value) => !value)}>
        Change text
      </Button>
    </div>
  );
}
export const Default: Story = { render: () => <MorphDemo /> };
export const Down: Story = { render: () => <MorphDemo direction="down" /> };
