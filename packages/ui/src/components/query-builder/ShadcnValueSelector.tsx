import * as React from "react";
import type { OptionList, VersatileSelectorProps } from "react-querybuilder";
import { isOptionGroupArray, useValueSelector } from "react-querybuilder";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@omnisuite/ui/components/select";

export type ShadcnValueSelectorProps = Omit<VersatileSelectorProps, "handleOnChange"> & {
  handleOnChange: VersatileSelectorProps["handleOnChange"];
};

export function ShadcnValueSelector({
  className,
  handleOnChange,
  options,
  value,
  title,
  disabled,
  multiple = false,
  listsAsArrays,
  testID,
  field: _field,
  fieldData: _fieldData,
  rule: _rule,
  ruleGroup: _ruleGroup,
  rules: _rules,
  path: _path,
  level: _level,
  context: _context,
  validation: _validation,
  schema: _schema,
  ...props
}: ShadcnValueSelectorProps): React.JSX.Element {
  const { onChange, val } = useValueSelector({
    handleOnChange,
    multiple,
    ...(value === undefined ? {} : { value }),
    ...(listsAsArrays === undefined ? {} : { listsAsArrays }),
  });

  const selectItems = React.useMemo(() => {
    const getItem = (option: { name: string; label: string }) => ({
      value: option.name,
      label: typeof option.label === "string" ? option.label : option.name,
    });
    const optionList = options as OptionList;

    return isOptionGroupArray(optionList)
      ? optionList.flatMap((group) => group.options.map(getItem))
      : optionList.map(getItem);
  }, [options]);

  const optionContent = React.useMemo(() => {
    const optionList = options as OptionList;

    if (isOptionGroupArray(optionList)) {
      return optionList.map((group) => (
        <SelectGroup key={group.label}>
          <SelectLabel>{group.label}</SelectLabel>
          {group.options.map((option) => (
            <SelectItem key={option.name} value={option.name}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ));
    }

    return (
      <SelectGroup>
        {optionList.map((option) => (
          <SelectItem key={option.name} value={option.name}>
            {option.label}
          </SelectItem>
        ))}
      </SelectGroup>
    );
  }, [options]);

  if (multiple) {
    const selectedValues = Array.isArray(val) ? (val as string[]) : [];

    return (
      <Select
        {...props}
        items={selectItems}
        multiple
        value={selectedValues}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger data-testid={testID} className={className} title={title}>
          <SelectValue>
            {(selected: string[]) =>
              selected.length === 0 ? "Select values" : `${selected.length} selected`
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>{optionContent}</SelectContent>
      </Select>
    );
  }

  return (
    <Select
      {...props}
      items={selectItems}
      value={typeof val === "string" ? val : null}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onChange(nextValue);
      }}
      disabled={disabled}
    >
      <SelectTrigger data-testid={testID} className={className} title={title}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>{optionContent}</SelectContent>
    </Select>
  );
}
