import { shareCollection } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@omnisuite/ui/components/dropdown-menu";
import { Button } from "@omnisuite/ui/components/button";
import { useState } from "react";
function MenuDemo({ example }: { example: "Default" | "Open" | "Choices" | "Nested" }) {
  const [pinned, setPinned] = useState(true);
  const [sort, setSort] = useState("name");
  const [action, setAction] = useState("");
  return (
    <div className="p-10">
      <DropdownMenu defaultOpen={example !== "Default"}>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          {example === "Nested" ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setAction("email")}>Email</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAction("link")}>Copy link</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : example === "Choices" ? (
            <>
              <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
                Pinned
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setAction("rename")}>
                Rename<DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setAction("delete")}>
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <output aria-label="Last action">{action}</output>
    </div>
  );
}
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "React/Components/Dropdown menu",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <MenuDemo example="Default" /> };
export const Open: Story = { render: () => <MenuDemo example="Open" /> };
export const Choices: Story = { render: () => <MenuDemo example="Choices" /> };

export const Nested: Story = { play: shareCollection, render: () => <MenuDemo example="Nested" /> };
