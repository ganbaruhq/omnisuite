import type { Html } from "@effect/ui/html";

/**
 * A boolean data attribute, present as `"true"` only while `on`, as calendar-react renders
 * `value || undefined`.
 */
export const flag = (on: boolean): string | undefined => (on ? "true" : undefined);

/**
 * Puts a part's declarations on a builder before the consumer's own, so the consumer's win, as
 * calendar-react spreads a consumer's `style` last. The merge runs when the element is built, so
 * it also sees a style the consumer chains after the part.
 */
export const withStyle = <B>(builder: B, style: Html.Style): B =>
  (builder as unknown as { forward: (hook: (node: any) => unknown) => B }).forward((node) => {
    const theirs: string | undefined = node.elementAttrs.style;
    const ours = node.style(style);
    const text = [ours.elementAttrs.style, theirs].filter(Boolean).join(";");
    return ours.attr("style", text === "" ? undefined : text);
  });
