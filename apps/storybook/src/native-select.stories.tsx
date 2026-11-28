import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@omnisuite/ui/components/native-select";
const meta = {
  title: "React/Components/Native select",
  component: NativeSelect,
  args: {
    "aria-label": "Owner",
    defaultValue: "design",
    children: (
      <>
        <NativeSelectOptGroup label="Teams">
          <NativeSelectOption value="design">Design</NativeSelectOption>
          <NativeSelectOption value="engineering">Engineering</NativeSelectOption>
          <NativeSelectOption value="archived" disabled>
            Archived
          </NativeSelectOption>
        </NativeSelectOptGroup>
      </>
    ),
  },
} satisfies Meta<typeof NativeSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { "aria-invalid": true } };
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <NativeSelect key={size} size={size} aria-label={size}>
          <NativeSelectOption>Design</NativeSelectOption>
          <NativeSelectOption>Engineering</NativeSelectOption>
        </NativeSelect>
      ))}
    </div>
  ),
};
