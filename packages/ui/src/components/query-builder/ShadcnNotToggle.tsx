import * as React from "react";
import type { NotToggleProps } from "react-querybuilder";
import { cn } from "cn";

import { Field, FieldLabel } from "@omnisuite/ui/components/field";
import { Switch } from "@omnisuite/ui/components/switch";

export type ShadcnNotToggleProps = Omit<NotToggleProps, "handleOnChange"> & {
  handleOnChange: NotToggleProps["handleOnChange"];
};

export function ShadcnNotToggle({
  className,
  handleOnChange,
  label,
  checked,
  title,
  disabled,
  testID,
  path: _path,
  level: _level,
  context: _context,
  validation: _validation,
  schema: _schema,
  ruleGroup: _ruleGroup,
  ...props
}: ShadcnNotToggleProps): React.JSX.Element {
  const id = React.useId();

  return (
    <Field
      orientation="horizontal"
      data-disabled={disabled || undefined}
      className={cn("w-auto gap-2", className)}
    >
      <Switch
        {...props}
        id={id}
        data-testid={testID}
        title={title}
        checked={Boolean(checked)}
        disabled={disabled}
        onCheckedChange={handleOnChange}
      />
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  );
}
