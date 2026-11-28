import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  inputGroupClasses,
  inputGroupTextClasses,
  inputGroupAddonVariants,
  inputGroupButtonVariants,
} from "@omnisuite/ui/lib/recipes/input-group";
import type { VariantProps } from "class-variance-authority";
import type { ControlSize } from "@omnisuite/ui/lib/recipes/control";
import { Button, type ButtonOptions } from "@omnisuite/ui/effect/components/button";
import { Input } from "@omnisuite/ui/effect/components/input";
import { Textarea } from "@omnisuite/ui/effect/components/textarea";
import type { InputElement, InputProps } from "@effect/ui-kit/Input";
import {
  inputGroupInputClasses,
  inputGroupTextareaClasses,
} from "@omnisuite/ui/lib/recipes/input-group";

export const InputGroup = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { size?: ControlSize; element?: Html.H<Msg>["div"] } = {},
) => {
  const { size = "default" } = options;
  return styledSlot(options.element ?? h.div, "input-group", ...inputGroupClasses).attrs({
    "data-size": size,
    role: "group",
  });
};

export const InputGroupText = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: { element?: Html.H<Msg>["span"] } = {},
) => {
  return styledSlot(options.element ?? h.span, "input-group-text", ...inputGroupTextClasses);
};

export const InputGroupAddon = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: {
    align?: NonNullable<VariantProps<typeof inputGroupAddonVariants>["align"]>;
    element?: Html.H<Msg>["div"];
  } = {},
) => {
  const { align = "inline-start" } = options;
  return styledSlot(
    options.element ?? h.div,
    "input-group-addon",
    inputGroupAddonVariants({ align }),
  ).attrs({ "data-align": align, role: "group" });
};

export const InputGroupInput = <Msg, R = never>(
  h: { readonly input: InputElement<Msg> },
  options: {
    readonly element?: InputElement<Msg, R> | undefined;
    readonly props: InputProps;
    readonly onUpdate?:
      | ((event: { readonly value: string }) => NoInfer<Msg> | undefined)
      | undefined;
  },
) => styledSlot(Input(h, options), "input-group-control", ...inputGroupInputClasses);

export const InputGroupTextarea = <Msg>(
  h: Pick<Html.H<Msg>, "textarea">,
  options: Parameters<typeof Textarea<Msg>>[1],
) => styledSlot(Textarea(h, options), "input-group-control", ...inputGroupTextareaClasses);

export const InputGroupButton = <Msg, R = never>(
  h: Parameters<typeof Button<Msg>>[0],
  options: Omit<ButtonOptions<Msg, R>, "size"> & {
    readonly size?: NonNullable<VariantProps<typeof inputGroupButtonVariants>["size"]>;
  } = {},
) => {
  const { size = "xs", variant = "ghost", ...rest } = options;
  return styledSlot(
    Button(h, { ...rest, variant }),
    "button",
    inputGroupButtonVariants({ size }),
  ).attr("data-size", size);
};
