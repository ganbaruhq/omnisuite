import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import {
  QueryBuilder,
  type Field,
  type QueryBuilderMode,
  type RuleGroupType,
} from "@omnisuite/ui/components/query-builder";

const meta = {
  title: "React/Form/Query Builder",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const FIELDS: Field[] = [
  { name: "name", label: "Customer name", placeholder: "Enter a name" },
  {
    name: "status",
    label: "Status",
    valueEditorType: "select",
    values: [
      { name: "active", label: "Active" },
      { name: "trial", label: "Trial" },
      { name: "churned", label: "Churned" },
    ],
  },
  { name: "seats", label: "Seats", datatype: "number" },
  { name: "createdAt", label: "Created at", datatype: "date", inputType: "date" },
  { name: "verified", label: "Verified", valueEditorType: "checkbox" },
];

const INITIAL_QUERY: RuleGroupType = {
  combinator: "and",
  rules: [
    { field: "status", operator: "=", value: "active" },
    { field: "seats", operator: ">=", value: 10 },
  ],
};

function QueryBuilderDemo({ defaultMode = "plain" }: { defaultMode?: QueryBuilderMode }) {
  const [query, setQuery] = React.useState(INITIAL_QUERY);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <QueryBuilder
        fields={FIELDS}
        query={query}
        onQueryChange={setQuery}
        defaultMode={defaultMode}
        inferFieldDefaults
        inferOperators
      />
      <pre className="content-scrollbar overflow-auto rounded-lg border bg-muted/45 p-4 text-xs text-muted-foreground">
        {JSON.stringify(query, null, 2)}
      </pre>
    </div>
  );
}

export const Modes: Story = {
  render: () => <QueryBuilderDemo />,
};

export const Advanced: Story = {
  render: () => <QueryBuilderDemo defaultMode="advanced" />,
};

export const Command: Story = {
  render: () => <QueryBuilderDemo defaultMode="command" />,
};
