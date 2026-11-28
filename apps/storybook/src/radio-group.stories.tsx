import { chooseGrid } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "@omnisuite/ui/components/radio-group";
const items = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "archived", label: "Archived", disabled: true },
];
const meta = { title: "React/Form/Radio group" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: chooseGrid,
  render: () => (
    <RadioGroup
      aria-label="View"
      defaultValue="list"
      disabled={false}
      aria-invalid={false}
      className="grid gap-2"
    >
      {items.map((item) => (
        <label key={item.value} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={item.value} disabled={item.disabled} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  ),
};
export const Disabled: Story = {
  render: () => (
    <RadioGroup
      aria-label="View"
      defaultValue="list"
      disabled={true}
      aria-invalid={false}
      className="grid gap-2"
    >
      {items.map((item) => (
        <label key={item.value} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={item.value} disabled={item.disabled} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  ),
};
export const Invalid: Story = {
  render: () => (
    <RadioGroup
      aria-label="View"
      defaultValue="list"
      disabled={false}
      aria-invalid={true}
      className="grid gap-2"
    >
      {items.map((item) => (
        <label key={item.value} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={item.value} disabled={item.disabled} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  ),
};
export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      aria-label="View"
      defaultValue="list"
      disabled={false}
      aria-invalid={false}
      className="flex gap-4"
    >
      {items.map((item) => (
        <label key={item.value} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={item.value} disabled={item.disabled} aria-label={item.label} />
          {item.label}
        </label>
      ))}
    </RadioGroup>
  ),
};
