import type { View } from "@effect/ui";
import type { Html } from "@effect/ui/html";
import { Switch as KitSwitch } from "@effect/ui-kit/Switch";
import type { SwitchButton, SwitchParts, SwitchProps } from "@effect/ui-kit/Switch";
import { switchClasses, switchThumbClasses } from "@omnisuite/ui/lib/recipes/switch";
import { styled } from "@omnisuite/ui/effect/lib/styled";

export type SwitchSize = "sm" | "default";

export interface StyledSwitchParts<Msg> extends SwitchParts<Msg> {
  /** The root on `element` (`h.button` by default) with the thumb inside. */
  readonly box: <R = never>(
    h: Pick<Html.H<Msg>, "button" | "span">,
    element?: SwitchButton<Msg, R>,
  ) => SwitchButton<Msg, R>;
}

/**
 * The kit's `Switch` with our styles on `root` and `thumb`, a `size`, and `box`, which draws the
 * root with its thumb:
 *
 * ```ts
 * Switch(h, {
 *   props: { checked: model.public },
 *   onToggle: ({ checked }) => Message.ToggledPublic({ checked }),
 *   view: (parts) => parts.box(h),
 * })
 * ```
 */
export const Switch = <Msg, A extends View.Content<Msg, any>>(
  h: View.Helper<Msg, unknown>,
  options: {
    readonly props: SwitchProps;
    readonly size?: SwitchSize | undefined;
    readonly onToggle?:
      | ((event: { readonly checked: boolean }) => NoInfer<Msg> | undefined)
      | undefined;
    readonly view: (parts: StyledSwitchParts<Msg>) => A;
  },
): A => {
  const { size = "default", view, ...kit } = options;
  return KitSwitch(h, {
    ...kit,
    view: (parts) => {
      const root: SwitchParts<Msg>["root"] = (element) =>
        parts.root(
          styled(element, switchClasses).attrs({ "data-slot": "switch", "data-size": size }),
        );
      const thumb: SwitchParts<Msg>["thumb"] = (element) =>
        parts.thumb(styled(element, switchThumbClasses).attr("data-slot", "switch-thumb"));
      return view({
        ...parts,
        root,
        thumb,
        box: (h, element) =>
          root((element ?? h.button) as SwitchButton<Msg, never>).children(thumb(h.span)) as never,
      });
    },
  });
};
