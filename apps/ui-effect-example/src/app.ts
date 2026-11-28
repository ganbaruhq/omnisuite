import { UiSchema, Validation } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Option, Schema } from "effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Checkbox } from "@omnisuite/ui/effect/components/checkbox";
import { Dialog } from "@omnisuite/ui/effect/components/dialog";
import {
  Field,
  FieldContent,
  FieldGroup,
  fieldValidationProps,
} from "@omnisuite/ui/effect/components/field";
import { Input } from "@omnisuite/ui/effect/components/input";
import { Label } from "@omnisuite/ui/effect/components/label";
import { Select } from "@omnisuite/ui/effect/components/select";
import { Switch } from "@omnisuite/ui/effect/components/switch";
import { Textarea } from "@omnisuite/ui/effect/components/textarea";
import { ToastProvider } from "@omnisuite/ui/effect/components/toast";
import { Tooltip } from "@omnisuite/ui/effect/components/tooltip";

// ---------------------------------------------------------------------------
// The form's rules
// ---------------------------------------------------------------------------

const CollectionValidation = Validation.make(
  {
    name: {
      required: "Give the collection a name",
      rules: [Validation.Rule.minLength(2), Validation.Rule.maxLength(40)],
    },
    description: { rules: [Validation.Rule.maxLength(160)] },
  },
  { mode: "onChange" },
);

const visibilities = [
  { value: "private", label: "Only me" },
  { value: "team", label: "My team" },
  { value: "public", label: "Everyone" },
] as const;

const visibilityLabel = (value: string) =>
  visibilities.find((visibility) => visibility.value === value)?.label ?? value;

const errorsOf = (field: Validation.Field<unknown>) =>
  field._tag === "Invalid" ? field.errors : [];

// ---------------------------------------------------------------------------
// The workspace: a button that opens the "New collection" dialog
// ---------------------------------------------------------------------------

const TextField = Schema.Literals(["name", "description"]);

const Message = UiSchema.TaggedEnum({
  SetDialogOpen: { open: Schema.Boolean },
  SetSelectOpen: { open: Schema.Boolean },
  SetTipOpen: { open: Schema.Boolean },
  UpdatedSearch: { value: Schema.String },
  UpdatedField: { name: TextField, value: Schema.String },
  PickedVisibility: { value: Schema.String },
  ToggledComments: { checked: Schema.Boolean },
  ToggledNotify: { checked: Schema.Boolean },
  Submitted: {},
});

const emptyForm = () => CollectionValidation.init({ name: "", description: "" });

const Workspace = Html.component({
  name: "Workspace",
  model: Schema.Struct({
    form: CollectionValidation.State,
    visibility: Schema.String,
    allowComments: Schema.Boolean,
    notify: Schema.Boolean,
    dialogOpen: Schema.Boolean,
    selectOpen: Schema.Boolean,
    tipOpen: Schema.Boolean,
    search: Schema.String,
    created: Schema.Number,
  }),
  message: Message,
}).make({
  init: () => ({
    form: emptyForm(),
    visibility: "team",
    allowComments: true,
    notify: false,
    dialogOpen: false,
    selectOpen: false,
    tipOpen: false,
    search: "",
    created: 0,
  }),
  update: {
    SetDialogOpen: ($, { open }) => $.evolve({ dialogOpen: () => open, tipOpen: () => false }),
    SetSelectOpen: ($, { open }) => $.evolve({ selectOpen: () => open }),
    SetTipOpen: ($, { open }) => $.evolve({ tipOpen: () => open }),
    UpdatedSearch: ($, { value }) => $.evolve({ search: () => value }),
    UpdatedField: ($, { name, value }) =>
      $.evolve({ form: (form) => CollectionValidation.change(form, name, value) }),
    PickedVisibility: ($, { value }) => $.evolve({ visibility: () => value }),
    ToggledComments: ($, { checked }) => $.evolve({ allowComments: () => checked }),
    ToggledNotify: ($, { checked }) => $.evolve({ notify: () => checked }),
    // A tried submit shows every field's error. `value` is `Some` only when all pass.
    Submitted: ($) => {
      const form = CollectionValidation.submit($.model.form);
      return Option.match(CollectionValidation.validate(form).value, {
        onNone: () => $.evolve({ form: () => form }),
        onSome: ({ name }) => {
          const created = $.model.created + 1;
          return $.evolve({
            form: emptyForm,
            dialogOpen: () => false,
            created: () => created,
          }).send(ToastProvider.kit, {
            _tag: "RequestedAdd",
            toast: {
              id: `collection-${created}`,
              type: "success",
              title: "Collection created",
              description: `“${name}” is visible to ${visibilityLabel($.model.visibility).toLowerCase()}.`,
            },
          });
        },
      });
    },
  },
  view: (h, model) => {
    const { fields } = CollectionValidation.validate(model.form);

    const nameField = Field(h, {
      props: fieldValidationProps(fields.name),
      view: (field) =>
        field.root(h.div).children(
          field.label(h.label).children("Name"),
          field
            .control(
              Input(h, {
                props: { value: fields.name.value },
                onUpdate: ({ value }) => Message.UpdatedField({ name: "name", value }),
              }),
            )
            .attr("placeholder", "Design system"),
          field.errors(h, errorsOf(fields.name)),
        ),
    });

    const descriptionField = Field(h, {
      props: fieldValidationProps(fields.description),
      view: (field) =>
        field.root(h.div).children(
          field.label(h.label).children("Description"),
          field.control(
            Textarea(h, {
              value: fields.description.value,
              onUpdate: ({ value }) => Message.UpdatedField({ name: "description", value }),
            }).attr("placeholder", "What goes in it?"),
          ),
          field.description(h.p).children("Optional, up to 160 characters."),
          field.errors(h, errorsOf(fields.description)),
        ),
    });

    const visibilityField = Field(h, {
      view: (field) =>
        field.root(h.div).children(
          Select(h, {
            props: { open: model.selectOpen, value: model.visibility, items: visibilities },
            onEmit: {
              RequestedOpen: () => Message.SetSelectOpen({ open: true }),
              RequestedClose: () => Message.SetSelectOpen({ open: false }),
              Picked: ({ value }) =>
                typeof value === "string" ? Message.PickedVisibility({ value }) : undefined,
              Settled: () => undefined,
            },
            // The kit's advice for a select in a field: the trigger is a member, and focus
            // moving into the popup stays within the field.
            view: (select) =>
              field
                .focusWithin(h.div)
                .class("flex flex-col gap-2")
                .children(
                  select.label(h.div).children("Visibility"),
                  select.control(h, { element: field.member(h.button) }).class("w-full"),
                  select.content(
                    h,
                    visibilities.map((visibility) => select.option(h, visibility)),
                  ),
                ),
          }),
        ),
    });

    const commentsField = Field(h, {
      view: (field) =>
        field.root(h.div, "horizontal").children(
          FieldContent(h).children(
            field.label(h.label).children("Allow comments"),
            field.description(h.p).children("Members can comment on its pages."),
          ),
          Switch(h, {
            props: { checked: model.allowComments },
            onToggle: ({ checked }) => Message.ToggledComments({ checked }),
            view: (parts) => parts.box(h, field.control(h.button)),
          }),
        ),
    });

    const notifyField = Field(h, {
      view: (field) =>
        field.root(h.div, "horizontal").children(
          Checkbox(h, {
            props: { checked: model.notify },
            onEmit: { Toggled: ({ checked }) => Message.ToggledNotify({ checked }) },
            view: (checkbox) => checkbox.box(h, field.control(h.button)),
          }),
          field.label(h.label).children("Notify members"),
        ),
    });

    return Dialog(h, {
      props: { open: model.dialogOpen },
      onEmit: {
        RequestedOpen: () => Message.SetDialogOpen({ open: true }),
        RequestedClose: () => Message.SetDialogOpen({ open: false }),
        Settled: () => undefined,
      },
      view: (dialog) =>
        h.main.class("mx-auto flex min-h-svh max-w-2xl flex-col items-start gap-6 p-10").children(
          h.div
            .class("flex flex-col gap-1")
            .children(
              h.h1.class("text-xl font-semibold").children("Collections"),
              h.p
                .class("text-sm text-muted-foreground")
                .children(
                  model.created === 0
                    ? "No collections yet."
                    : `${model.created} created in this session.`,
                ),
            ),
          h.div.class("flex w-full items-end gap-3").children(
            h.div.class("flex flex-1 flex-col gap-2").children(
              Label(h).attr("for", "collection-search").children("Search"),
              Input(h, {
                props: { value: model.search },
                onUpdate: ({ value }) => Message.UpdatedSearch({ value }),
              }).attrs({
                id: "collection-search",
                type: "search",
                placeholder: "Filter collections",
              }),
            ),
            Tooltip(h, {
              props: { open: model.tipOpen },
              onEmit: {
                RequestedOpen: () => Message.SetTipOpen({ open: true }),
                RequestedClose: () => Message.SetTipOpen({ open: false }),
              },
              view: (tooltip) =>
                h.div.children(
                  tooltip.trigger(dialog.trigger(Button(h))).children("New collection"),
                  tooltip.content(h, ["Group pages under one name"]),
                ),
            }),
          ),
          dialog.content(h, [
            dialog
              .header(h.div)
              .children(
                dialog.title(h.h2).children("New collection"),
                dialog.description(h.p).children("Collections group related pages."),
              ),
            h.form
              .attr("novalidate", "")
              .class("grid gap-6")
              .on("submit", Message.Submitted())
              .children(
                FieldGroup(h).children(
                  nameField,
                  descriptionField,
                  visibilityField,
                  commentsField,
                  notifyField,
                ),
                dialog
                  .footer(h.div)
                  .children(
                    dialog.close(Button(h, { variant: "outline" })).children("Cancel"),
                    Button(h, { props: { type: "submit" } }).children("Create"),
                  ),
              ),
          ]),
        ),
    });
  },
});

// ---------------------------------------------------------------------------
// The root: the toast provider around the workspace
// ---------------------------------------------------------------------------

export const App = Html.component({
  name: "App",
  model: Schema.Struct({}),
  message: Schema.Never,
}).make({
  init: () => ({}),
  update: ($) => $.model,
  view: (h) =>
    ToastProvider(h, {
      view: (toastProvider) => h.div(Workspace(h, {}), toastProvider.toaster(h)),
    }),
});
