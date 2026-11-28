import { composeStories, type Meta, type StoryObj } from "@storybook/react-vite";
import * as reactStories from "./benchmark.stories";
import * as effectStories from "./effect/benchmark.stories";

import { verifyMount } from "./effect/verify-mount";

const { Page: ReactBenchmark } = composeStories(reactStories);
const { Default: EffectBenchmark } = composeStories(effectStories);

const meta = {
  title: "Effect/Form/New collection vs React",
  parameters: { layout: "fullscreen" },
  play: verifyMount,
  render: () => (
    <div className="grid min-h-svh grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <section aria-label="React benchmark" className="min-w-0">
        <h2 className="border-b px-10 py-4 font-semibold">React · Base UI</h2>
        <ReactBenchmark />
      </section>
      <section aria-label="Effect benchmark" className="min-w-0">
        <h2 className="border-b px-10 py-4 font-semibold">Effect UI</h2>
        <EffectBenchmark />
      </section>
    </div>
  ),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
