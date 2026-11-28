import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import { statusDotVariants } from "@omnisuite/ui/lib/recipes/status-dot";
import type { VariantProps } from "class-variance-authority";

export const StatusDot = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: {
    status?: NonNullable<VariantProps<typeof statusDotVariants>["status"]>;
    pulse?: boolean;
    label?: string;
    element?: Html.H<Msg>["span"];
  } = {},
) => {
  const { status = "neutral", pulse = false, label } = options;
  return styledSlot(options.element ?? h.span, "status-dot", statusDotVariants({ status, pulse }))
    .attrs({ "data-status": status, "aria-label": label })
    .forward((node) => {
      const labelled = node.elementAttrs["aria-label"] !== undefined;
      return node.attrs({
        role: labelled ? "img" : undefined,
        "aria-hidden": labelled ? undefined : "true",
      });
    });
};
export type StatusDotStatus = NonNullable<VariantProps<typeof statusDotVariants>["status"]>;
export { statusDotVariants };
