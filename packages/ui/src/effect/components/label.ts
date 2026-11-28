import type { Html } from "@effect/ui/html";
import { labelClasses } from "@omnisuite/ui/lib/recipes/label";
import { styled } from "@omnisuite/ui/effect/lib/styled";

/** A styled `<label>`. Inside a `Field`, use the field's `label` part instead, which points `for` at the control. */
export const Label = <Msg>(h: Pick<Html.H<Msg>, "label">) =>
  styled(h.label, labelClasses).attr("data-slot", "label");
