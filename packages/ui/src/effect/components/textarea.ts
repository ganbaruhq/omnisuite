import type { Html } from "@effect/ui/html";
import { textareaClasses } from "@omnisuite/ui/lib/recipes/textarea";
import { styled } from "@omnisuite/ui/effect/lib/styled";

/**
 * A styled `<textarea>` that shows `value` and maps what is typed to a message. The kit's
 * `Input` draws `<input>` only, so this one is ours.
 *
 * ```ts
 * Textarea(h, { value: model.notes, onUpdate: ({ value }) => Message.UpdatedNotes({ value }) })
 * ```
 */
export const Textarea = <Msg>(
  h: Pick<Html.H<Msg>, "textarea">,
  options: {
    readonly value: string;
    readonly disabled?: boolean | undefined;
    readonly onUpdate?: ((event: { readonly value: string }) => Msg) | undefined;
  },
) => {
  const textarea = styled(h.textarea, textareaClasses)
    .attr("data-slot", "textarea")
    .value(options.value)
    .disabled(options.disabled ?? false);
  const { onUpdate } = options;
  return onUpdate === undefined
    ? textarea
    : textarea.on("input", ({ value }) => onUpdate({ value }));
};
