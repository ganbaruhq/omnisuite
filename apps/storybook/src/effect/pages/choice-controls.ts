import { UiSchema, Validation } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Option, Redacted, Schema } from "effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Field, FieldGroup, fieldValidationProps } from "@omnisuite/ui/effect/components/field";
import { RadioGroup } from "@omnisuite/ui/effect/components/radio-group";
import { Slider } from "@omnisuite/ui/effect/components/slider";
import { Toggle } from "@omnisuite/ui/effect/components/toggle";
import { ToggleGroup } from "@omnisuite/ui/effect/components/toggle-group";
import { Combobox } from "@omnisuite/ui/effect/components/combobox";
import { InputOTP } from "@omnisuite/ui/effect/components/input-otp";

const Preferences = Validation.make(
  {
    audience: { required: "Choose an audience" },
    capacity: {
      value: Schema.Number,
      rules: [[(value) => value >= 1 && value <= 100, "Capacity must be between 1 and 100"]],
    },
    sharing: {
      value: Schema.Boolean,
      isEmpty: (value) => !value,
      required: "Enable sharing to invite members",
    },
    views: { value: Schema.Array(Schema.String), required: "Choose at least one view" },
    owner: { required: "Choose an owner" },
    code: {
      value: Schema.Redacted(Schema.String),
      required: "Enter your verification code",
      rules: [[(value) => /^\d{6}$/.test(Redacted.value(value)), "Enter all six digits"]],
    },
  },
  { mode: "onChange" },
);

const audiences = [
  { value: "private", label: "Only me" },
  { value: "team", label: "Team" },
  { value: "public", label: "Public", disabled: true },
];
const views = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
];
const owners = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "archived", label: "Archived", disabled: true },
];
const errorsOf = (field: Validation.Field<unknown>) =>
  field._tag === "Invalid" ? field.errors : [];
const Message = UiSchema.TaggedEnum({
  PickedAudience: { value: Schema.String },
  MovedCapacity: { value: Schema.Number },
  ToggledSharing: { pressed: Schema.Boolean },
  ToggledViews: { value: Schema.Array(Schema.String) },
  OpenedOwners: { open: Schema.Boolean },
  TypedOwner: { inputValue: Schema.String },
  PickedOwner: { value: Schema.String },
  UpdatedCode: { value: Schema.Redacted(Schema.String) },
  Submitted: {},
});

export const ChoiceControls = Html.component({
  name: "ChoiceControls",
  model: Schema.Struct({
    form: Preferences.State,
    ownersOpen: Schema.Boolean,
    ownerQuery: Schema.String,
    saved: Schema.Boolean,
  }),
  message: Message,
}).make({
  init: () => ({
    form: Preferences.init({
      audience: "",
      capacity: 0,
      sharing: false,
      views: [],
      owner: "",
      code: Redacted.make(""),
    }),
    ownersOpen: false,
    ownerQuery: "",
    saved: false,
  }),
  update: {
    PickedAudience: ($, { value }) =>
      $.evolve({ form: (form) => Preferences.change(form, "audience", value), saved: () => false }),
    MovedCapacity: ($, { value }) =>
      $.evolve({ form: (form) => Preferences.change(form, "capacity", value), saved: () => false }),
    ToggledSharing: ($, { pressed }) =>
      $.evolve({
        form: (form) => Preferences.change(form, "sharing", pressed),
        saved: () => false,
      }),
    ToggledViews: ($, { value }) =>
      $.evolve({ form: (form) => Preferences.change(form, "views", value), saved: () => false }),
    OpenedOwners: ($, { open }) => $.evolve({ ownersOpen: () => open }),
    TypedOwner: ($, { inputValue }) => $.evolve({ ownerQuery: () => inputValue }),
    PickedOwner: ($, { value }) =>
      $.evolve({ form: (form) => Preferences.change(form, "owner", value), saved: () => false }),
    UpdatedCode: ($, { value }) =>
      $.evolve({ form: (form) => Preferences.change(form, "code", value), saved: () => false }),
    Submitted: ($) => {
      const form = Preferences.submit($.model.form);
      return $.evolve({
        form: () => form,
        saved: () => Option.isSome(Preferences.validate(form).value),
      });
    },
  },
  view: (h, model) => {
    const { fields } = Preferences.validate(model.form);
    return h.section
      .attr("aria-label", "Collection controls")
      .class("mx-auto grid max-w-2xl gap-6 px-10 pb-10")
      .children(
        h.div.children(
          h.h2.class("text-lg font-semibold").children("Collection preferences"),
          h.p
            .class("text-sm text-muted-foreground")
            .children("Choice and input controls with field validation."),
        ),
        h.form
          .attr("novalidate", "")
          .on("submit", Message.Submitted())
          .children(
            FieldGroup(h).children(
              Field(h, {
                key: "audience",
                props: fieldValidationProps(fields.audience),
                view: (field) =>
                  field.root(h.div).children(
                    field.legend(h.div).class("text-sm font-medium").children("Audience"),
                    RadioGroup(h, {
                      props: {
                        value: fields.audience.value || null,
                        items: audiences,
                        invalid: field.invalid,
                        disabled: field.disabled,
                      },
                      onEmit: { Picked: Message.PickedAudience },
                      view: (radio) =>
                        radio
                          .root(field.group(h.div))
                          .children(
                            audiences.map(({ value, label }) =>
                              h.label
                                .class("flex items-center gap-2 text-sm")
                                .children(
                                  radio
                                    .option(h, { value, element: field.member(h.button) })
                                    .attr("aria-label", label),
                                  label,
                                ),
                            ),
                          ),
                    }),
                    field.errors(h, errorsOf(fields.audience)),
                  ),
              }),
              Field(h, {
                key: "capacity",
                props: fieldValidationProps(fields.capacity),
                view: (field) =>
                  field.root(h.div).children(
                    field.label(h.label).children("Capacity"),
                    Slider(h, {
                      props: {
                        value: fields.capacity.value,
                        min: 0,
                        max: 100,
                        disabled: field.disabled,
                      },
                      onEmit: {
                        Moved: ({ value }) =>
                          Message.MovedCapacity({
                            value: typeof value === "number" ? value : (value[0] ?? 0),
                          }),
                        Committed: () => undefined,
                      },
                      view: (slider) =>
                        h.div.class("grid gap-2").children(
                          slider.controlWithThumbs(h, {
                            labels: ["Capacity"],
                            input: () => field.control(h.input),
                          }),
                          slider.value(h.output),
                        ),
                    }),
                    field.errors(h, errorsOf(fields.capacity)),
                  ),
              }),
              Field(h, {
                key: "sharing",
                props: fieldValidationProps(fields.sharing),
                view: (field) =>
                  field.root(h.div).children(
                    field.label(h.label).children("Enable sharing"),
                    Toggle(h, {
                      element: field.control(h.button),
                      props: { pressed: fields.sharing.value, disabled: field.disabled },
                      variant: "outline",
                      onToggle: Message.ToggledSharing,
                    }).children("Enable sharing"),
                    field.errors(h, errorsOf(fields.sharing)),
                  ),
              }),
              Field(h, {
                key: "views",
                props: fieldValidationProps(fields.views),
                view: (field) =>
                  field.root(h.div).children(
                    field.legend(h.div).class("text-sm font-medium").children("Views"),
                    ToggleGroup(h, {
                      props: {
                        value: fields.views.value,
                        items: views,
                        multiple: true,
                        disabled: field.disabled,
                      },
                      onEmit: { Toggled: Message.ToggledViews },
                      view: (group) =>
                        group.root(field.group(h.div), { spacing: 0, variant: "outline" }).children(
                          views.map(({ value, label }) =>
                            group
                              .item({
                                element: field.member(h.button),
                                value,
                                spacing: 0,
                                variant: "outline",
                              })
                              .children(label),
                          ),
                        ),
                    }),
                    field.errors(h, errorsOf(fields.views)),
                  ),
              }),
              Field(h, {
                key: "owner",
                props: fieldValidationProps(fields.owner),
                view: (field) =>
                  field.root(h.div).children(
                    field.label(h.label).children("Owner"),
                    Combobox(h, {
                      props: {
                        open: model.ownersOpen,
                        inputValue: model.ownerQuery,
                        value: fields.owner.value || null,
                        items: owners,
                        disabled: field.disabled,
                      },
                      onEmit: {
                        RequestedOpen: () => Message.OpenedOwners({ open: true }),
                        RequestedClose: () => Message.OpenedOwners({ open: false }),
                        RequestedInputValue: Message.TypedOwner,
                        Picked: ({ value }) =>
                          Message.PickedOwner({ value: typeof value === "string" ? value : "" }),
                        Highlighted: () => undefined,
                        Settled: () => undefined,
                      },
                      view: (combo) =>
                        h.div(
                          combo.control(h, {
                            label: "Owner",
                            element: field.control(h.input),
                            showClear: true,
                          }),
                          combo.content(
                            h,
                            combo.items.map((item) => combo.option(h, item)),
                          ),
                        ),
                    }),
                    field.errors(h, errorsOf(fields.owner)),
                  ),
              }),
              Field(h, {
                key: "code",
                props: fieldValidationProps(fields.code),
                view: (field) =>
                  field.root(h.div).children(
                    field.legend(h.div).class("text-sm font-medium").children("Verification code"),
                    InputOTP(h, {
                      props: { value: fields.code.value, length: 6, disabled: field.disabled },
                      onEmit: {
                        Updated: Message.UpdatedCode,
                        Completed: () => undefined,
                        Rejected: () => undefined,
                      },
                      view: (otp) =>
                        otp.control(h, {
                          label: "Verification code",
                          element: field.group(h.div),
                          input: () => field.member(h.input),
                        }),
                    }),
                    field.errors(h, errorsOf(fields.code)),
                  ),
              }),
              Button(h, { props: { type: "submit" } }).children("Save preferences"),
              h.output
                .attr("aria-label", "Preferences status")
                .children(model.saved ? "Preferences saved" : "Unsaved preferences"),
            ),
          ),
      );
  },
});
