import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { HtmlLocator, HtmlScene } from "@effect/ui/html/testing";
import { Effect, Redacted, Schema } from "effect";
import { it } from "vite-plus/test";
import { InputOTP } from "@omnisuite/ui/effect/components/input-otp";

const Message = UiSchema.TaggedEnum({
  Updated: { value: Schema.Redacted(Schema.String) },
  Completed: {},
  Rejected: {},
});
const Example = Html.component({
  name: "OTPExample",
  model: Schema.Struct({ value: Schema.Redacted(Schema.String), status: Schema.String }),
  message: Message,
}).make({
  init: () => ({ value: Redacted.make(""), status: "Editing" }),
  update: {
    Updated: ($, { value }) => $.evolve({ value: () => value }),
    Completed: ($) => $.evolve({ status: () => "Complete" }),
    Rejected: ($) => $.evolve({ status: () => "Rejected" }),
  },
  view: (h, model) =>
    h.div(
      InputOTP(h, {
        props: { value: model.value, length: 4, required: true },
        onEmit: {
          Updated: Message.Updated,
          Completed: () => Message.Completed(),
          Rejected: () => Message.Rejected(),
        },
        view: (otp) => otp.control(h, { label: "Code", input: () => h.input.class("size-8") }),
      }),
      h.output.attr("aria-label", "Status").children(model.status),
    ),
});

const Disabled = Html.component({
  name: "DisabledOTP",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    InputOTP(h, {
      props: { value: Redacted.make("12"), length: 4, disabled: true, readOnly: true },
      onEmit: { Updated: () => undefined, Completed: () => undefined, Rejected: () => undefined },
      view: (otp) => otp.control(h, { label: "Disabled code" }),
    }),
});

it("InputOTP keeps disabled and readonly states on its visible native slots", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Disabled, {});
        const first = HtmlLocator.role("textbox", { name: "Disabled code 1 of 4" });
        scene
          .expect(first)
          .toHaveAttribute("disabled", "")
          .expect(first)
          .toHaveAttribute("readonly", "")
          .expect(first)
          .toHaveAttribute("data-disabled", "")
          .expect(HtmlLocator.role("group", { name: "Disabled code" }))
          .toHaveAttribute("class", /has-disabled:opacity-50/)
          .expect(first)
          .toHaveValue("1");
      }),
    ),
  ));

it("InputOTP renders named slots and maps Updated, Completed and Rejected with redacted values", () =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Example, {});
        const first = HtmlLocator.role("textbox", { name: "Code 1 of 4" });
        const last = HtmlLocator.role("textbox", { name: "Code 4 of 4" });
        scene
          .expect(first)
          .toHaveAttribute("data-slot", "input-otp-slot")
          .expect(first)
          .toHaveAttribute("class", /size-8/)
          .expect(first)
          .toHaveAttribute("class", /data-focused:border-ring/)
          .expect(last)
          .toHaveAttribute("required", "")
          .childEmit(InputOTP.kit, {
            _tag: "Updated",
            value: Redacted.make("1234"),
            reason: "input-paste",
          })
          .expect(first)
          .toHaveValue("1")
          .expect(last)
          .toHaveValue("4")
          .childEmit(InputOTP.kit, {
            _tag: "Completed",
            value: Redacted.make("1234"),
            reason: "input-paste",
          })
          .expect(HtmlLocator.role("status", { name: "Status" }))
          .toHaveText("Complete")
          .childEmit(InputOTP.kit, {
            _tag: "Rejected",
            value: Redacted.make("x"),
            reason: "input-change",
          })
          .expect(HtmlLocator.role("status", { name: "Status" }))
          .toHaveText("Rejected");
      }),
    ),
  ));
