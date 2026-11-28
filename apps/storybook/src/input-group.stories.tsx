import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
  InputGroupTextarea,
} from "@omnisuite/ui/components/input-group";

const meta = { title: "React/Form/Input group" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <InputGroup size="default" className="w-72">
      <InputGroupInput aria-label="Email" placeholder="you@example.com" />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
export const Disabled: Story = {
  render: () => (
    <InputGroup size="default" className="w-72">
      <InputGroupInput aria-label="Email" placeholder="you@example.com" disabled />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
export const Invalid: Story = {
  render: () => (
    <InputGroup size="default" className="w-72">
      <InputGroupInput aria-label="Email" placeholder="you@example.com" aria-invalid />
      <InputGroupAddon>
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <InputGroup key={size} size={size} className="w-72">
          <InputGroupInput aria-label="Email" placeholder="you@example.com" />
          <InputGroupAddon>
            <InputGroupText>@</InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Send</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ))}
    </div>
  ),
};
export const Multiline: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupTextarea aria-label="Message" placeholder="Write a message" />
      <InputGroupAddon align="block-start">Message</InputGroupAddon>
      <InputGroupAddon align="block-end">
        <InputGroupButton>Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
