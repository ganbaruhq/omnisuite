import * as React from "react";
import type { ValueEditorProps } from "react-querybuilder";
import { getFirstOption, parseNumber, useValueEditor } from "react-querybuilder";
import { cn } from "cn";

import { Checkbox } from "@omnisuite/ui/components/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@omnisuite/ui/components/field";
import { Input } from "@omnisuite/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@omnisuite/ui/components/radio-group";
import { Switch } from "@omnisuite/ui/components/switch";
import { Textarea } from "@omnisuite/ui/components/textarea";

export interface ShadcnValueEditorProps extends Omit<ValueEditorProps, "handleOnChange"> {
  handleOnChange: ValueEditorProps["handleOnChange"];
  extraProps?: Record<string, unknown>;
}

export function ShadcnValueEditor(allProps: ShadcnValueEditorProps): React.JSX.Element | null {
  const {
    fieldData,
    operator,
    value,
    handleOnChange,
    title,
    className,
    type,
    values = [],
    listsAsArrays,
    separator,
    valueSource: _valueSource,
    disabled,
    testID,
    selectorComponent: SelectorComponent = allProps.schema.controls.valueSelector,
    validation: _validation,
    extraProps,
    inputType,
    parseNumbers: _parseNumbers,
    skipHook: _skipHook,
    ...propsForValueSelector
  } = allProps;

  const {
    valueAsArray,
    multiValueHandler,
    valueListItemClassName,
    inputTypeCoerced,
    bigIntValueHandler,
    parseNumberMethod,
  } = useValueEditor(allProps);

  if (operator === "null" || operator === "notNull") return null;

  const placeholder = fieldData?.placeholder ?? "";

  if (
    (operator === "between" || operator === "notBetween") &&
    (type === "select" || type === "text")
  ) {
    const editors = ["from", "to"].map((key, index) =>
      type === "text" ? (
        <Input
          key={key}
          type={inputTypeCoerced}
          placeholder={placeholder}
          value={valueAsArray[index] ?? ""}
          className={cn("w-32", valueListItemClassName)}
          disabled={disabled}
          onChange={(event) => multiValueHandler(event.target.value, index)}
          {...extraProps}
        />
      ) : (
        <SelectorComponent
          key={key}
          {...propsForValueSelector}
          className={valueListItemClassName}
          handleOnChange={(nextValue) => multiValueHandler(nextValue, index)}
          value={valueAsArray[index] ?? getFirstOption(values)}
          options={values}
          {...(disabled === undefined ? {} : { disabled })}
          {...(listsAsArrays === undefined ? {} : { listsAsArrays })}
        />
      ),
    );

    return (
      <span data-testid={testID} className={className} title={title}>
        {editors[0]}
        {separator}
        {editors[1]}
      </span>
    );
  }

  switch (type) {
    case "select":
    case "multiselect":
      return (
        <SelectorComponent
          {...propsForValueSelector}
          schema={allProps.schema}
          handleOnChange={handleOnChange}
          value={value}
          options={values}
          multiple={type === "multiselect"}
          {...(testID === undefined ? {} : { testID })}
          {...(className === undefined ? {} : { className })}
          {...(title === undefined ? {} : { title })}
          {...(disabled === undefined ? {} : { disabled })}
          {...(listsAsArrays === undefined ? {} : { listsAsArrays })}
        />
      );

    case "textarea":
      return (
        <Textarea
          data-testid={testID}
          className={className}
          value={value}
          title={title}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => handleOnChange(event.target.value)}
          {...extraProps}
        />
      );

    case "switch":
      return (
        <Switch
          data-testid={testID}
          className={className}
          title={title}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={handleOnChange}
          {...extraProps}
        />
      );

    case "checkbox":
      return (
        <Checkbox
          data-testid={testID}
          className={className}
          title={title}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={handleOnChange}
          {...extraProps}
        />
      );

    case "radio":
      return (
        <FieldSet data-testid={testID} className={className} title={title}>
          <FieldLegend className="sr-only">{title ?? fieldData?.label}</FieldLegend>
          <FieldGroup className="gap-2">
            <RadioGroup value={value} onValueChange={handleOnChange} {...extraProps}>
              {values.map((option) => (
                <RadioItem
                  key={option.name}
                  value={option.name}
                  label={option.label}
                  {...(disabled === undefined ? {} : { disabled })}
                />
              ))}
            </RadioGroup>
          </FieldGroup>
        </FieldSet>
      );
  }

  if (inputType === "bigint") {
    return (
      <Input
        data-testid={testID}
        type={inputTypeCoerced}
        placeholder={placeholder}
        value={`${value}`}
        title={title}
        className={cn("w-48", className)}
        disabled={disabled}
        onChange={(event) => bigIntValueHandler(event.target.value)}
        {...extraProps}
      />
    );
  }

  return (
    <Input
      data-testid={testID}
      type={inputTypeCoerced}
      placeholder={placeholder}
      value={value ?? ""}
      title={title}
      className={cn("w-48", className)}
      disabled={disabled}
      onChange={(event) =>
        handleOnChange(parseNumber(event.target.value, { parseNumbers: parseNumberMethod }))
      }
      {...extraProps}
    />
  );
}

function RadioItem({
  value,
  label,
  disabled,
}: {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}) {
  const id = React.useId();

  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      <RadioGroupItem id={id} value={value} disabled={disabled} />
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  );
}
