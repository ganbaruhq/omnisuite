import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { InputOTP } from "@omnisuite/ui/effect/components/input-otp";
import { Redacted } from "effect";

const Message = UiSchema.TaggedEnum({ Updated: { value: Schema.Redacted(Schema.String) } });
export const input_otpDemo = (example: "Default" | "Filled" | "Disabled" | "Invalid") =>
  Html.component({
    name: "InputOtpDemo",
    model: Schema.Struct({ value: Schema.Redacted(Schema.String) }),
    message: Message,
  }).make({
    init: () => ({ value: Redacted.make(example === "Filled" ? "123456" : "") }),
    update: { Updated: ($, { value }) => $.evolve({ value }) },
    view: (h, model) => {
      return InputOTP(h, {
        props: { value: model.value, length: 6, disabled: example === "Disabled" },
        onEmit: { Updated: Message.Updated, Completed: () => undefined, Rejected: () => undefined },
        view: (otp) =>
          otp.control(h, {
            label: "Verification code",
            input: () => h.input.attr("aria-invalid", example === "Invalid" ? "true" : undefined),
          }),
      });
    },
  });
