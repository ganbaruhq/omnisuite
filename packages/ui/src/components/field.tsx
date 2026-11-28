"use client";

import { useMemo } from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Label } from "@omnisuite/ui/components/label";
import { Separator } from "@omnisuite/ui/components/separator";
import {
  fieldSetClasses,
  fieldLegendClasses,
  fieldGroupClasses,
  fieldContentClasses,
  fieldTitleClasses,
  fieldErrorClasses,
  fieldVariants,
  fieldLabelClasses,
  fieldDescriptionClasses,
} from "@omnisuite/ui/lib/recipes/field";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn(fieldSetClasses, className)} {...props} />;
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(fieldLegendClasses, className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn(fieldGroupClasses, className)} {...props} />;
}

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-content" className={cn(fieldContentClasses, className)} {...props} />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label data-slot="field-label" className={cn(...fieldLabelClasses, className)} {...props} />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-label" className={cn(fieldTitleClasses, className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(...fieldDescriptionClasses, className)}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-xs/relaxed group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn(fieldErrorClasses, className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
