import { selectOwner } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@omnisuite/ui/components/select";
const items = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "React/Form/Select",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: selectOwner,
  render: () => (
    <Select items={items} defaultValue={"design"} defaultOpen={false} disabled={false}>
      <SelectTrigger className="w-64" aria-label="Owner" aria-invalid={false}>
        <SelectValue placeholder="Choose an owner" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
export const Placeholder: Story = {
  render: () => (
    <Select items={items} defaultValue={null} defaultOpen={false} disabled={false}>
      <SelectTrigger className="w-64" aria-label="Owner" aria-invalid={false}>
        <SelectValue placeholder="Choose an owner" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
export const Open: Story = {
  render: () => (
    <Select items={items} defaultValue={"design"} defaultOpen={true} disabled={false}>
      <SelectTrigger className="w-64" aria-label="Owner" aria-invalid={false}>
        <SelectValue placeholder="Choose an owner" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Select items={items} defaultValue={"design"} defaultOpen={false} disabled={true}>
      <SelectTrigger className="w-64" aria-label="Owner" aria-invalid={false}>
        <SelectValue placeholder="Choose an owner" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
export const Invalid: Story = {
  render: () => (
    <Select items={items} defaultValue={"design"} defaultOpen={false} disabled={false}>
      <SelectTrigger className="w-64" aria-label="Owner" aria-invalid={true}>
        <SelectValue placeholder="Choose an owner" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <Select key={size} items={items} defaultValue="design">
          <SelectTrigger size={size} className="w-64" aria-label={size}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};
