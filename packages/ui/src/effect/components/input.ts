import { Input as KitInput } from "@effect/ui-kit/Input";
import type { InputElement, InputProps } from "@effect/ui-kit/Input";
import { inputClasses } from "@omnisuite/ui/lib/recipes/input";
import { styled } from "@omnisuite/ui/effect/lib/styled";

/**
 * The kit's `Input` with our styles: returns the `<input>` builder, so the caller sets `type`,
 * `placeholder` and the rest.
 *
 * ```ts
 * Input(h, { props: { value: model.name }, onUpdate: ({ value }) => Message.UpdatedName({ value }) })
 * ```
 */
export const Input = <Msg, R = never>(
  h: { readonly input: InputElement<Msg> },
  options: {
    readonly element?: InputElement<Msg, R> | undefined;
    readonly props: InputProps;
    readonly onUpdate?:
      | ((event: { readonly value: string }) => NoInfer<Msg> | undefined)
      | undefined;
  },
): InputElement<Msg, R> => styled(KitInput(h, options), inputClasses).attr("data-slot", "input");
