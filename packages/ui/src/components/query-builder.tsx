import * as React from "react";
import { IconAdjustmentsHorizontal, IconCommand, IconFilter, IconPlus } from "@tabler/icons-react";
import { cn } from "cn";
import {
  QueryBuilder as ReactQueryBuilder,
  add,
  type Field,
  type FullCombinator,
  type FullField,
  type FullOperator,
  type QueryBuilderProps as ReactQueryBuilderProps,
  type RuleGroupType,
} from "react-querybuilder";

import { Button } from "@omnisuite/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@omnisuite/ui/components/command";
import { Field as FormField, FieldTitle } from "@omnisuite/ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@omnisuite/ui/components/popover";
import {
  QueryBuilderShadcn,
  type ShadcnValueSelectorProps,
} from "@omnisuite/ui/components/query-builder/index";
import { ToggleGroup, ToggleGroupItem } from "@omnisuite/ui/components/toggle-group";

export type QueryBuilderMode = "plain" | "advanced" | "command";

type CoreQueryBuilderProps = ReactQueryBuilderProps<
  RuleGroupType,
  FullField,
  FullOperator,
  FullCombinator
>;

export interface QueryBuilderProps extends Omit<
  CoreQueryBuilderProps,
  "controlClassnames" | "controlElements" | "defaultQuery" | "fields" | "onQueryChange" | "query"
> {
  fields: Field[];
  query?: RuleGroupType;
  defaultQuery?: RuleGroupType;
  onQueryChange?: (query: RuleGroupType) => void;
  mode?: QueryBuilderMode;
  defaultMode?: QueryBuilderMode;
  modes?: QueryBuilderMode[];
  onModeChange?: (mode: QueryBuilderMode) => void;
  className?: string;
  controlClassnames?: CoreQueryBuilderProps["controlClassnames"];
  controlElements?: CoreQueryBuilderProps["controlElements"];
}

const DEFAULT_QUERY: RuleGroupType = { combinator: "and", rules: [] };
const DEFAULT_MODES: QueryBuilderMode[] = ["plain", "advanced", "command"];

const MODE_OPTIONS = {
  plain: { label: "Plain", icon: IconFilter },
  advanced: { label: "Advanced", icon: IconAdjustmentsHorizontal },
  command: { label: "Command", icon: IconCommand },
} satisfies Record<QueryBuilderMode, { label: string; icon: React.ComponentType }>;

export function QueryBuilder({
  fields,
  query,
  defaultQuery = DEFAULT_QUERY,
  onQueryChange,
  mode,
  defaultMode = "plain",
  modes = DEFAULT_MODES,
  onModeChange,
  className,
  controlClassnames,
  controlElements,
  showCloneButtons,
  showNotToggle,
  showUngroupButtons,
  ...props
}: QueryBuilderProps): React.JSX.Element {
  const [internalQuery, setInternalQuery] = React.useState(defaultQuery);
  const [internalMode, setInternalMode] = React.useState(defaultMode);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const currentQuery = query ?? internalQuery;
  const currentMode = mode ?? internalMode;
  const modeLabelId = React.useId();

  const updateQuery = React.useCallback(
    (nextQuery: RuleGroupType) => {
      if (query === undefined) setInternalQuery(nextQuery);
      onQueryChange?.(nextQuery);
    },
    [onQueryChange, query],
  );

  const updateMode = React.useCallback(
    (nextMode: QueryBuilderMode) => {
      if (mode === undefined) setInternalMode(nextMode);
      onModeChange?.(nextMode);
    },
    [mode, onModeChange],
  );

  const modeControlElements = React.useMemo(
    () => ({
      ...controlElements,
      ...(currentMode === "advanced" ? null : { addGroupAction: null }),
      ...(currentMode === "command" ? { addRuleAction: null } : null),
    }),
    [controlElements, currentMode],
  );

  const modeControlClassnames = React.useMemo(
    () => ({
      ...controlClassnames,
      queryBuilder: cn("queryBuilder-responsive", controlClassnames?.queryBuilder),
    }),
    [controlClassnames],
  );

  const addFieldRule = React.useCallback(
    (field: Field) => {
      const operator = getDefaultOperator(field);
      const nextQuery = add(
        currentQuery,
        {
          field: field.name,
          operator,
          value: field.defaultValue ?? "",
        },
        [],
      );

      updateQuery(nextQuery);
      setCommandOpen(false);
    },
    [currentQuery, updateQuery],
  );

  return (
    <div data-slot="query-builder" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {modes.length > 1 ? (
          <FormField orientation="horizontal" className="w-auto">
            <FieldTitle id={modeLabelId}>Mode</FieldTitle>
            <ToggleGroup
              value={[currentMode]}
              onValueChange={(value) => {
                const nextMode = value[0] as QueryBuilderMode | undefined;
                if (nextMode) updateMode(nextMode);
              }}
              variant="outline"
              spacing={0}
              aria-labelledby={modeLabelId}
            >
              {modes.map((modeOption) => {
                const option = MODE_OPTIONS[modeOption];
                const Icon = option.icon;

                return (
                  <ToggleGroupItem key={modeOption} value={modeOption}>
                    <Icon data-icon="inline-start" aria-hidden />
                    {option.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </FormField>
        ) : null}

        {currentMode === "command" ? (
          <Popover open={commandOpen} onOpenChange={setCommandOpen}>
            <PopoverTrigger render={<Button variant="outline" />}>
              <IconPlus data-icon="inline-start" aria-hidden />
              Add filter
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <Command>
                <CommandInput placeholder="Search fields..." />
                <CommandList>
                  <CommandEmpty>No fields found.</CommandEmpty>
                  <CommandGroup heading="Fields">
                    {fields.map((field) => (
                      <CommandItem
                        key={field.name}
                        value={`${field.name} ${String(field.label)}`}
                        onSelect={() => addFieldRule(field)}
                      >
                        {field.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      <QueryBuilderShadcn>
        <ReactQueryBuilder
          {...props}
          fields={fields}
          query={currentQuery}
          onQueryChange={updateQuery}
          controlElements={modeControlElements}
          controlClassnames={modeControlClassnames}
          showCloneButtons={currentMode === "advanced" ? (showCloneButtons ?? true) : false}
          showNotToggle={currentMode === "advanced" ? (showNotToggle ?? true) : false}
          showUngroupButtons={currentMode === "advanced" ? (showUngroupButtons ?? true) : false}
        />
      </QueryBuilderShadcn>
    </div>
  );
}

function getDefaultOperator(field: Field): string {
  if (field.defaultOperator) return field.defaultOperator;
  if (!Array.isArray(field.operators)) return "=";

  const firstEntry = field.operators[0];
  const groupedOptions =
    firstEntry && typeof firstEntry === "object" && "options" in firstEntry
      ? firstEntry.options
      : undefined;
  const firstOperator = Array.isArray(groupedOptions) ? groupedOptions[0] : firstEntry;

  if (typeof firstOperator === "string") return firstOperator;
  return firstOperator?.name ?? firstOperator?.value ?? "=";
}

export {
  QueryBuilderShadcn,
  shadcnControlElements,
} from "@omnisuite/ui/components/query-builder/index";
export { formatQuery } from "react-querybuilder";
export type { Field, RuleGroupType, RuleType } from "react-querybuilder";
export type { ShadcnValueSelectorProps };
