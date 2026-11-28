import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { IconArrowRight, IconArrowUp, IconPlus } from "@tabler/icons-react";
import {
  Badge,
  BadgeDot,
  BadgeImage,
  BadgeWithButton,
  type BadgeColor,
  type BadgeSize,
  type BadgeVariant,
} from "@omnisuite/ui/components/badge";

// Mirrors the sections of https://www.untitledui.com/react/components/badges:
// one story per type (Pill / Badge / Modern), each with every content row at sm · md · lg.

const meta = {
  title: "React/Components/Badge",
  component: Badge,
  args: { children: "Label", variant: "pill-color", color: "brand", size: "md" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

const SIZES: BadgeSize[] = ["sm", "md", "lg"];
const COLORS: BadgeColor[] = [
  "gray",
  "brand",
  "error",
  "warning",
  "success",
  "slate",
  "sky",
  "blue",
  "indigo",
  "purple",
  "pink",
  "orange",
];
const AVATAR = "https://i.pravatar.cc/64?img=47";
const FLAG = "https://www.untitledui.com/images/flags/AU.svg";

function Dismissible(props: { variant: BadgeVariant; color: BadgeColor; size: BadgeSize }) {
  const [visible, setVisible] = useState(true);
  return visible ? (
    <BadgeWithButton {...props} buttonLabel="Clear" onButtonClick={() => setVisible(false)}>
      Label
    </BadgeWithButton>
  ) : (
    <button type="button" className="text-xs underline" onClick={() => setVisible(true)}>
      Reset
    </button>
  );
}

const ROWS: {
  title: string;
  render: (p: { variant: BadgeVariant; color: BadgeColor; size: BadgeSize }) => React.ReactNode;
}[] = [
  { title: "Label", render: (p) => <Badge {...p}>Label</Badge> },
  {
    title: "With dot",
    render: (p) => (
      <Badge {...p}>
        <BadgeDot />
        Label
      </Badge>
    ),
  },
  {
    title: "With flag",
    render: (p) => (
      <Badge {...p}>
        <BadgeImage src={FLAG} alt="" />
        Australia
      </Badge>
    ),
  },
  {
    title: "With avatar",
    render: (p) => (
      <Badge {...p}>
        <BadgeImage src={AVATAR} alt="" />
        Olivia
      </Badge>
    ),
  },
  { title: "With close X", render: (p) => <Dismissible {...p} /> },
  {
    title: "With icon leading",
    render: (p) => (
      <Badge {...p}>
        <IconArrowUp data-icon="inline-start" />
        Label
      </Badge>
    ),
  },
  {
    title: "With icon trailing",
    render: (p) => (
      <Badge {...p}>
        Label
        <IconArrowRight data-icon="inline-end" />
      </Badge>
    ),
  },
  {
    title: "With icon only",
    render: (p) => (
      <Badge {...p} role="img" aria-label="Add">
        <IconPlus data-icon="only" />
      </Badge>
    ),
  },
];

function TypeShowcase({ variant, color }: { variant: BadgeVariant; color: BadgeColor }) {
  return (
    <div className="grid grid-cols-[auto_repeat(3,auto)] items-center gap-x-8 gap-y-4">
      <span />
      {SIZES.map((size) => (
        <span key={size} className="text-xs text-muted-foreground">
          {size}
        </span>
      ))}
      {ROWS.map((row) => (
        <div key={row.title} className="contents">
          <span className="text-xs text-muted-foreground">{row.title}</span>
          {SIZES.map((size) => (
            <div key={size}>{row.render({ variant, color, size })}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ColorShowcase({ variant }: { variant: BadgeVariant }) {
  return (
    <div className="flex max-w-3xl flex-wrap gap-2">
      {COLORS.map((color) => (
        <Badge key={color} variant={variant} color={color}>
          <BadgeDot />
          {color}
        </Badge>
      ))}
    </div>
  );
}

function TypeStory({ variant, color }: { variant: BadgeVariant; color: BadgeColor }) {
  return (
    <div className="flex flex-col gap-8">
      <TypeShowcase variant={variant} color={color} />
      <ColorShowcase variant={variant} />
    </div>
  );
}

export const Default: Story = {};

/** Untitled's "Badge example": the same dot badge in each type. */
export const Example: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["pill-color", "color", "modern"] as const).map((variant) => (
        <Badge key={variant} variant={variant} color="brand">
          <BadgeDot />
          Label
        </Badge>
      ))}
    </div>
  ),
};

export const Pill: Story = { render: () => <TypeStory variant="pill-color" color="brand" /> };
export const Rectangle: Story = {
  name: "Badge",
  render: () => <TypeStory variant="color" color="brand" />,
};
/** Modern stays white; `color` only tints the dot and icons. */
export const Modern: Story = { render: () => <TypeStory variant="modern" color="brand" /> };
