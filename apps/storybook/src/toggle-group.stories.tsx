import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleGroup, ToggleGroupItem } from "@omnisuite/ui/components/toggle-group";
const items = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "archived", label: "Archived", disabled: true },
];
const meta = { title: "React/Form/Toggle group" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={false}
      disabled={false}
      orientation="horizontal"
      variant="default"
      spacing={2}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Multiple: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={true}
      disabled={false}
      orientation="horizontal"
      variant="default"
      spacing={2}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Disabled: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={false}
      disabled={true}
      orientation="horizontal"
      variant="default"
      spacing={2}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={false}
      disabled={false}
      orientation="vertical"
      variant="default"
      spacing={2}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Outline: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={false}
      disabled={false}
      orientation="horizontal"
      variant="outline"
      spacing={2}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Joined: Story = {
  render: () => (
    <ToggleGroup
      defaultValue={["list"]}
      multiple={false}
      disabled={false}
      orientation="horizontal"
      variant="outline"
      spacing={0}
      aria-label="View"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <ToggleGroup key={size} size={size} defaultValue={["list"]} aria-label={size}>
          {items.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ))}
    </div>
  ),
};
