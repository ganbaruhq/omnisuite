import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandShortcut,
} from "@omnisuite/ui/components/command";
const meta = { title: "React/Components/Command" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Command className="w-80 rounded-xl border">
      <CommandInput placeholder="Search commands" aria-label="Search commands" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Collections">
          <CommandItem>
            New collection<CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>Open collection</CommandItem>
          <CommandItem disabled>Delete collection</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
export const Empty: Story = {
  render: () => (
    <Command className="w-80 rounded-xl border">
      <CommandInput value="No match" aria-label="Search commands" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandItem>New collection</CommandItem>
      </CommandList>
    </Command>
  ),
};
