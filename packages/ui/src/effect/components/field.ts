import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Field as KitField, fieldValidationProps } from "@effect/ui-kit/Field";
import {
  fieldContentClasses,
  fieldDescriptionClasses,
  fieldErrorClasses,
  fieldGroupClasses,
  fieldLabelClasses,
  fieldTitleClasses,
  fieldVariants,
} from "@omnisuite/ui/lib/recipes/field";
import { labelClasses } from "@omnisuite/ui/lib/recipes/label";
import { restyle, styled, stylePart, styledSlot } from "@omnisuite/ui/effect/lib/styled";

export type FieldOrientation = "vertical" | "horizontal" | "responsive";

// The kit writes `data-invalid` and `data-disabled` empty, where the React recipes match Base
// UI's and ours `data-invalid="true"`, so each such variant gets its empty-valued twin.
const fieldRootStates = "data-invalid:text-destructive";
const fieldDisabledStates = "group-data-disabled/field:opacity-50";

/**
 * The kit's `Field` with our styles. `root` takes an orientation, and `errors` draws the error
 * part with one message, or a list of them, only while the field shows its error:
 *
 * ```ts
 * Field(h, {
 *   props: fieldValidationProps(fields.name),
 *   view: (field) =>
 *     field.root(h.div).children(
 *       field.label(h.label).children("Name"),
 *       field.control(Input(h, { props: { value: model.name } })),
 *       field.errors(h, fields.name._tag === "Invalid" ? fields.name.errors : []),
 *     ),
 * })
 * ```
 */
export const Field = restyle(KitField, (field) => {
  const error = stylePart(field.error, "field-error", fieldErrorClasses);
  return {
    ...field,
    root: <B extends View.PartTarget<string>>(
      builder: B,
      orientation: FieldOrientation = "vertical",
    ): ReturnType<B["attr"]> =>
      field.root(
        styledSlot(builder, "field", fieldVariants({ orientation }), fieldRootStates)
          .attr("role", "group")
          .attr("data-orientation", orientation) as unknown as B,
      ),
    label: stylePart(
      field.label,
      "field-label",
      labelClasses,
      ...fieldLabelClasses,
      fieldDisabledStates,
    ),
    description: stylePart(field.description, "field-description", ...fieldDescriptionClasses),
    error,
    /**
     * The error part on a `<div>` with `errors`: the message when there is one, a list when there
     * are more, and nothing while the field shows no error or there are none.
     */
    errors: <Msg>(h: Pick<Html.H<Msg>, "div" | "ul" | "li">, errors: ReadonlyArray<string>) => {
      const unique = [...new Set(errors)];
      if (unique.length === 0) return undefined;
      return error(h.div)?.children(
        unique.length === 1
          ? unique[0]
          : h.ul
              .class("ml-4 flex list-disc flex-col gap-1")
              .children(unique.map((message) => h.li.children(message))),
      );
    },
  };
});

/** Stacks fields, as React's `FieldGroup`. */
export const FieldGroup = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "field-group", fieldGroupClasses);

/** Holds a label and its description beside a control, as React's `FieldContent`. */
export const FieldContent = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "field-content", fieldContentClasses);

/** A field title that isn't a `<label>`, as React's `FieldTitle`. */
export const FieldTitle = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styled(h.div, fieldTitleClasses, fieldDisabledStates).attr("data-slot", "field-label");

export { fieldValidationProps };
