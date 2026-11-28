import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusDot } from "@omnisuite/ui/components/status-dot";

const meta = { title: "React/Components/Status dot" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Statuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["success", "warning", "destructive", "info", "neutral"] as const).map((status) => (
        <span key={status} className="flex items-center gap-2 text-sm">
          <StatusDot status={status} pulse={false} aria-label={status} />
          {status}
        </span>
      ))}
    </div>
  ),
};
export const Pulse: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["success", "warning", "destructive", "info", "neutral"] as const).map((status) => (
        <span key={status} className="flex items-center gap-2 text-sm">
          <StatusDot status={status} pulse={true} aria-label={status} />
          {status}
        </span>
      ))}
    </div>
  ),
};
