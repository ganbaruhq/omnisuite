import type { Html } from "@effect/ui/html";
import { OTPField } from "@effect/ui-kit/OTPField";
import {
  inputOTPContainerClasses,
  inputOTPClasses,
  inputOTPGroupClasses,
  inputOTPSeparatorClasses,
} from "@omnisuite/ui/lib/recipes/input-otp";
import { restyle, stylePart, styleElementPart, styledSlot } from "@omnisuite/ui/effect/lib/styled";

const slotClasses =
  "relative flex size-7 items-center justify-center border-y border-r border-input bg-input/20 text-xs/relaxed transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md aria-invalid:border-destructive data-focused:z-10 data-focused:border-ring data-focused:ring-2 data-focused:ring-ring/30 data-focused:aria-invalid:border-destructive data-focused:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focused:aria-invalid:ring-destructive/40";

export const InputOTPGroup = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "input-otp-group", inputOTPGroupClasses);
export const InputOTPSeparator = <Msg>(h: Pick<Html.H<Msg>, "div" | "svg" | "path">) =>
  styledSlot(h.div, "input-otp-separator", inputOTPSeparatorClasses)
    .attr("role", "separator")
    .children(
      h.svg
        .attrs({
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "aria-hidden": "true",
        })
        .children(h.path.attr("d", "M5 12h14")),
    );

/** The kit's redacted OTPField, with one native input per slot and native caret. */
export const InputOTP = restyle(OTPField, (otp) => {
  const root = stylePart(otp.root, "input-otp", inputOTPContainerClasses);
  const input = styleElementPart(
    otp.input,
    "input-otp-slot",
    inputOTPClasses,
    slotClasses,
    "text-center",
  );
  return {
    ...otp,
    root,
    input,
    control: <Msg>(
      h: Pick<Html.H<Msg>, "div" | "input">,
      options: {
        readonly label: string;
        readonly element?: ReturnType<Html.H<Msg>["div"]["attr"]>;
        readonly input?: (index: number) => ReturnType<Html.H<Msg>["input"]["attr"]>;
      },
    ) =>
      root(options.element ?? h.div)
        .attr("aria-label", options.label)
        .children(
          InputOTPGroup(h).children(
            Array.from({ length: otp.length }, (_, index) =>
              input({
                element: (options.input?.(index) ?? h.input).attr(
                  "aria-label",
                  `${options.label} ${index + 1} of ${otp.length}`,
                ),
                index,
              }),
            ),
          ),
        ),
  };
});
