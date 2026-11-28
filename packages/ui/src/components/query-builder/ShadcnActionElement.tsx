import * as React from "react";
import type { ActionProps } from "react-querybuilder";

import { Button } from "@omnisuite/ui/components/button";

export type ShadcnActionProps = Omit<ActionProps, "handleOnClick"> & {
  handleOnClick: ActionProps["handleOnClick"];
};

export function ShadcnActionElement({
  className,
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
  testID,
  rules: _rules,
  ruleOrGroup: _ruleOrGroup,
  path: _path,
  level: _level,
  context: _context,
  validation: _validation,
  schema: _schema,
  ...props
}: ShadcnActionProps): React.JSX.Element {
  const removeAction = className?.includes("remove") ?? false;

  return (
    <Button
      {...props}
      data-testid={testID}
      type="button"
      variant={removeAction ? "ghost" : "outline"}
      size={removeAction ? "icon" : "default"}
      className={className}
      title={disabledTranslation && disabled ? disabledTranslation.title : title}
      aria-label={removeAction && typeof label === "string" ? title : undefined}
      disabled={disabled && !disabledTranslation}
      onClick={(event: React.MouseEvent) => handleOnClick(event)}
    >
      {disabledTranslation && disabled ? disabledTranslation.label : label}
    </Button>
  );
}
