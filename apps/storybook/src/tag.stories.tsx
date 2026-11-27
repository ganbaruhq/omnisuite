import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StatusDot } from "@omnisuite/ui/components/status-dot";
import { Tag, TagAvatar, TagCount, TagGroup } from "@omnisuite/ui/components/tag";

const meta = {
  title: "Components/Tag",
  component: Tag,
  args: { children: "Label" },
} satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ["sm", "md", "lg"] as const;
const INITIAL = [
  { id: "design", label: "Design", count: 12 },
  { id: "engineering", label: "Engineering", count: 48 },
  { id: "marketing", label: "Marketing", count: 7 },
  { id: "finance", label: "Finance", count: 3 },
];

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <TagGroup key={size} aria-label={`Tags ${size}`} size={size}>
          <Tag>Label</Tag>
          <Tag>
            <StatusDot status="success" />
            Active
          </Tag>
          <Tag>
            <TagAvatar src="https://i.pravatar.cc/64?img=47" />
            Olivia Rhye
          </Tag>
          <Tag>
            Design
            <TagCount>12</TagCount>
          </Tag>
        </TagGroup>
      ))}
    </div>
  ),
};

function RemovableTags({ selectable }: { selectable?: boolean }) {
  const [items, setItems] = useState(INITIAL);
  const [selected, setSelected] = useState<string[]>(["design"]);
  return (
    <div className="flex flex-col gap-3">
      <TagGroup
        aria-label="Teams"
        size="md"
        selectionMode={selectable ? "multiple" : "none"}
        value={selected}
        onValueChange={setSelected}
        onRemove={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
      >
        {items.map((item) => (
          <Tag key={item.id} value={item.id}>
            {item.label}
            <TagCount>{item.count}</TagCount>
          </Tag>
        ))}
      </TagGroup>
      <button
        type="button"
        className="w-fit text-xs text-muted-foreground underline"
        onClick={() => setItems(INITIAL)}
      >
        Reset example
      </button>
    </div>
  );
}

export const Removable: Story = { render: () => <RemovableTags /> };

export const Selectable: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <TagGroup
          key={size}
          aria-label={`Status ${size}`}
          size={size}
          selectionMode="multiple"
          defaultValue={["active"]}
        >
          <Tag value="active">Active</Tag>
          <Tag value="archived">Archived</Tag>
          <Tag value="draft" disabled>
            Draft
          </Tag>
        </TagGroup>
      ))}
    </div>
  ),
};

export const SingleSelect: Story = {
  render: () => (
    <TagGroup aria-label="Sort" selectionMode="single" defaultValue={["recent"]}>
      <Tag value="recent">Recent</Tag>
      <Tag value="name">Name</Tag>
      <Tag value="size">Size</Tag>
    </TagGroup>
  ),
};

export const SelectableRemovable: Story = { render: () => <RemovableTags selectable /> };
