import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@omnisuite/ui/components/field";
import { Input } from "@omnisuite/ui/components/input";

const meta = { title: "React/Form/Field" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Field orientation="vertical" data-invalid={false} data-disabled={false} className="w-80">
      <FieldContent>
        <FieldLabel htmlFor="field-name">Collection name</FieldLabel>
        <FieldDescription>Visible to your team.</FieldDescription>
      </FieldContent>
      <Input id="field-name" placeholder="Design system" disabled={false} aria-invalid={false} />
    </Field>
  ),
};
export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" data-invalid={false} data-disabled={false} className="w-80">
      <FieldContent>
        <FieldLabel htmlFor="field-name">Collection name</FieldLabel>
        <FieldDescription>Visible to your team.</FieldDescription>
      </FieldContent>
      <Input id="field-name" placeholder="Design system" disabled={false} aria-invalid={false} />
    </Field>
  ),
};
export const Responsive: Story = {
  render: () => (
    <Field orientation="responsive" data-invalid={false} data-disabled={false} className="w-80">
      <FieldContent>
        <FieldLabel htmlFor="field-name">Collection name</FieldLabel>
        <FieldDescription>Visible to your team.</FieldDescription>
      </FieldContent>
      <Input id="field-name" placeholder="Design system" disabled={false} aria-invalid={false} />
    </Field>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Field orientation="vertical" data-invalid={false} data-disabled={true} className="w-80">
      <FieldContent>
        <FieldLabel htmlFor="field-name">Collection name</FieldLabel>
        <FieldDescription>Visible to your team.</FieldDescription>
      </FieldContent>
      <Input id="field-name" placeholder="Design system" disabled={true} aria-invalid={false} />
    </Field>
  ),
};
export const Invalid: Story = {
  render: () => (
    <Field orientation="vertical" data-invalid={true} data-disabled={false} className="w-80">
      <FieldContent>
        <FieldLabel htmlFor="field-name">Collection name</FieldLabel>
        <FieldDescription>Visible to your team.</FieldDescription>
      </FieldContent>
      <Input id="field-name" placeholder="Design system" disabled={false} aria-invalid={true} />
      <FieldError>Give the collection a name</FieldError>
    </Field>
  ),
};
