import type { Html } from "@effect/ui/html";
import { RadioGroup as KitRadioGroup } from "@effect/ui-kit/RadioGroup";
import {
  radioGroupClasses,
  radioGroupItemClasses,
  radioGroupIndicatorClasses,
  radioGroupDotClasses,
} from "@omnisuite/ui/lib/recipes/radio-group";
import { restyle, stylePart, styleElementPart, styled } from "@omnisuite/ui/effect/lib/styled";

export const RadioGroup = restyle(KitRadioGroup, (radio) => {
  const root = stylePart(radio.root, "radio-group", radioGroupClasses);
  const item = styleElementPart(
    radio.radio,
    "radio-group-item",
    radioGroupItemClasses,
    "group-aria-invalid/radio-group:border-destructive group-aria-invalid/radio-group:ring-3 group-aria-invalid/radio-group:ring-destructive/20 group-aria-invalid/radio-group:aria-checked:border-primary dark:group-aria-invalid/radio-group:border-destructive/50 dark:group-aria-invalid/radio-group:ring-destructive/40",
  );
  const indicator = styleElementPart(
    radio.indicator,
    "radio-group-indicator",
    radioGroupIndicatorClasses,
    "data-unchecked:hidden",
  );
  return {
    ...radio,
    root: stylePart(root, "radio-group", "group/radio-group"),
    radio: item,
    indicator,
    option: <Msg>(
      h: Pick<Html.H<Msg>, "button" | "span">,
      option: {
        readonly value: string;
        readonly element?: ReturnType<Html.H<Msg>["button"]["attr"]>;
      },
    ) =>
      item({ element: option.element ?? h.button, value: option.value }).children(
        indicator({ element: h.span, value: option.value })?.children(
          styled(h.span, radioGroupDotClasses),
        ),
      ),
  };
});
