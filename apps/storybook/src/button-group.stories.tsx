import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@omnisuite/ui/components/button-group";
import { Button } from "@omnisuite/ui/components/button";

const meta = { title: "React/Components/Button group" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <ButtonGroup aria-label="Page actions">
      <ButtonGroup>
        <Button variant="outline">Documentation</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button>Create collection</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};
export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Page actions">
      <Button variant="outline">Documentation</Button>
      <Button variant="outline">Create collection</Button>
    </ButtonGroup>
  ),
};
export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup aria-label="Zoom">
      <ButtonGroupText>100%</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="outline">Zoom in</Button>
    </ButtonGroup>
  ),
};
