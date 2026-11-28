import type { VariantProps } from "class-variance-authority";
import { Button as KitButton } from "@effect/ui-kit/Button";
import type { ButtonElement, ButtonProps } from "@effect/ui-kit/Button";
import { buttonVariants } from "@omnisuite/ui/lib/recipes/button";
import { styled } from "@omnisuite/ui/effect/lib/styled";

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export interface ButtonOptions<Msg, R> {
  /** A builder to draw on instead of `h.button`, such as a dialog's `trigger` part's. */
  readonly element?: ButtonElement<Msg, R> | undefined;
  readonly props?: ButtonProps | undefined;
  /** The message a press sends. */
  readonly onPress?: NoInfer<Msg> | undefined;
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | undefined;
}

/**
 * The kit's `Button` with our variants: returns the `<button>` builder, so the caller adds the
 * children and any class of its own, which wins over ours.
 *
 * ```ts
 * Button(h, { variant: "outline", onPress: Message.ClickedCancel() }).children("Cancel")
 * ```
 */
export const Button = <Msg, R = never>(
  h: { readonly button: ButtonElement<Msg> },
  options: ButtonOptions<Msg, R> = {},
): ButtonElement<Msg, R> => {
  const { variant = "default", size = "default", element, props, onPress } = options;
  return styled(KitButton(h, { element, props, onPress }), buttonVariants({ variant, size })).attrs(
    { "data-slot": "button", "data-variant": variant, "data-size": size },
  );
};

export { buttonVariants };
