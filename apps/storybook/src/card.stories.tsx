import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@omnisuite/ui/components/card";
import { Button } from "@omnisuite/ui/components/button";

const meta = { title: "React/Components/Card" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <Card size="default" className="w-80">
      <CardHeader>
        <CardTitle>Design system</CardTitle>
        <CardDescription>Shared components for your workspace.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            …
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>24 components ready to use.</CardContent>
      <CardFooter>
        <Button>View collection</Button>
      </CardFooter>
    </Card>
  ),
};
export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-80">
      <CardHeader>
        <CardTitle>Design system</CardTitle>
        <CardDescription>Shared components for your workspace.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            …
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>24 components ready to use.</CardContent>
      <CardFooter>
        <Button>View collection</Button>
      </CardFooter>
    </Card>
  ),
};
