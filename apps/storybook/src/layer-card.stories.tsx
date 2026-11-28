import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  LayerCard,
  LayerCardPrimary,
  LayerCardSecondary,
} from "@omnisuite/ui/components/layer-card";

const meta = { title: "React/Components/Layer card" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (
    <LayerCard className="w-80">
      <LayerCardPrimary>
        <h2 className="font-semibold">Design system</h2>
        <p>24 shared components.</p>
      </LayerCardPrimary>
      <LayerCardSecondary>Updated today</LayerCardSecondary>
    </LayerCard>
  ),
};
