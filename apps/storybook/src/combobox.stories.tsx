import { searchOwner } from "./story-interactions";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxValue,
} from "@omnisuite/ui/components/combobox";
const items = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const meta = {
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  title: "React/Form/Combobox",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: searchOwner,
  render: () => (
    <Combobox
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue="design"
      defaultOpen={false}
      defaultInputValue="Design"
      disabled={false}
    >
      <ComboboxInput aria-label="Owner" className="w-64" showClear aria-invalid={false} />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Open: Story = {
  render: () => (
    <Combobox
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue="design"
      defaultOpen={true}
      defaultInputValue="Design"
      disabled={false}
    >
      <ComboboxInput aria-label="Owner" className="w-64" showClear aria-invalid={false} />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Disabled: Story = {
  render: () => (
    <Combobox
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue="design"
      defaultOpen={false}
      defaultInputValue="Design"
      disabled={true}
    >
      <ComboboxInput aria-label="Owner" className="w-64" showClear aria-invalid={false} />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Invalid: Story = {
  render: () => (
    <Combobox
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue="design"
      defaultOpen={false}
      defaultInputValue="Design"
      disabled={false}
    >
      <ComboboxInput aria-label="Owner" className="w-64" showClear aria-invalid={true} />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Empty: Story = {
  render: () => (
    <Combobox
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue="design"
      defaultOpen={true}
      defaultInputValue="No match"
      disabled={false}
    >
      <ComboboxInput aria-label="Owner" className="w-64" showClear aria-invalid={false} />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Multiple: Story = {
  render: () => (
    <Combobox
      multiple
      items={items}
      itemToStringLabel={(value: string | (typeof items)[number]) =>
        typeof value === "string"
          ? (items.find((item) => item.value === value)?.label ?? value)
          : value.label
      }
      defaultValue={["design"]}
    >
      <ComboboxChips className="w-64">
        <ComboboxValue>
          {(values: string[]) =>
            values.map((value) => (
              <ComboboxChip key={value}>
                {items.find((item) => item.value === value)?.label}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput aria-label="Owner" />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof items)[number]) => (
            <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["xs", "sm", "default", "md", "lg"] as const).map((size) => (
        <Combobox
          key={size}
          items={items}
          itemToStringLabel={(value: string | (typeof items)[number]) =>
            typeof value === "string"
              ? (items.find((item) => item.value === value)?.label ?? value)
              : value.label
          }
          defaultValue="design"
        >
          <ComboboxInput size={size} aria-label={size} className="w-64" showClear />
          <ComboboxContent>
            <ComboboxList>
              {(item: (typeof items)[number]) => (
                <ComboboxItem key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  ),
};
