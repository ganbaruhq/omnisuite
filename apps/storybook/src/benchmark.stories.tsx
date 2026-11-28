import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Button } from "@omnisuite/ui/components/button";
import { Checkbox } from "@omnisuite/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@omnisuite/ui/components/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@omnisuite/ui/components/field";
import { Input } from "@omnisuite/ui/components/input";
import { Label } from "@omnisuite/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@omnisuite/ui/components/select";
import { Switch } from "@omnisuite/ui/components/switch";
import { Textarea } from "@omnisuite/ui/components/textarea";
import { Toaster, toast } from "@omnisuite/ui/components/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@omnisuite/ui/components/tooltip";

// The React twin of the "New collection" form in `apps/ui-effect-example`, the Effect UI
// benchmark. Keep the two in step: they are compared side by side, in light and dark.

const meta = {
  title: "Benchmark/New collection",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const visibilities = [
  { value: "private", label: "Only me" },
  { value: "team", label: "My team" },
  { value: "public", label: "Everyone" },
];

const visibilityLabel = (value: string) =>
  visibilities.find((visibility) => visibility.value === value)?.label ?? value;

function nameErrors(name: string) {
  if (name.length === 0) return ["Give the collection a name"];
  if (name.length < 2) return ["Must be at least 2 characters"];
  if (name.length > 40) return ["Must be at most 40 characters"];
  return [];
}

const descriptionErrors = (description: string) =>
  description.length > 160 ? ["Must be at most 160 characters"] : [];

function Workspace({
  defaultOpen = false,
  defaultSubmitted = false,
}: {
  readonly defaultOpen?: boolean;
  readonly defaultSubmitted?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [submitted, setSubmitted] = React.useState(defaultSubmitted);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState("team");
  const [allowComments, setAllowComments] = React.useState(true);
  const [notify, setNotify] = React.useState(false);
  const [created, setCreated] = React.useState(0);
  const [search, setSearch] = React.useState("");

  // As the Effect form, which validates on change: a field shows its error once it was edited,
  // and every field does after a tried submit.
  const [touched, setTouched] = React.useState({ name: false, description: false });
  const errors = {
    name: submitted || touched.name ? nameErrors(name) : [],
    description: submitted || touched.description ? descriptionErrors(description) : [],
  };

  const reset = () => {
    setSubmitted(false);
    setTouched({ name: false, description: false });
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-start gap-6 p-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {created === 0 ? "No collections yet." : `${created} created in this session.`}
          </p>
        </div>
        <div className="flex w-full items-end gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="collection-search">Search</Label>
            <Input
              id="collection-search"
              type="search"
              placeholder="Filter collections"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger render={<DialogTrigger render={<Button />} />}>
                New collection
              </TooltipTrigger>
              <TooltipContent>Group pages under one name</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>Collections group related pages.</DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (nameErrors(name).length > 0 || descriptionErrors(description).length > 0) return;
              setCreated(created + 1);
              setOpen(false);
              toast.add({
                type: "success",
                title: "Collection created",
                description: `“${name}” is visible to ${visibilityLabel(visibility).toLowerCase()}.`,
              });
              reset();
            }}
          >
            <FieldGroup>
              <Field data-invalid={errors.name.length > 0 || undefined}>
                <FieldLabel htmlFor="collection-name">Name</FieldLabel>
                <Input
                  id="collection-name"
                  placeholder="Design system"
                  aria-invalid={errors.name.length > 0 || undefined}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setTouched((fields) => ({ ...fields, name: true }));
                  }}
                />
                <FieldError errors={errors.name.map((message) => ({ message }))} />
              </Field>
              <Field data-invalid={errors.description.length > 0 || undefined}>
                <FieldLabel htmlFor="collection-description">Description</FieldLabel>
                <Textarea
                  id="collection-description"
                  placeholder="What goes in it?"
                  aria-invalid={errors.description.length > 0 || undefined}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setTouched((fields) => ({ ...fields, description: true }));
                  }}
                />
                <FieldDescription>Optional, up to 160 characters.</FieldDescription>
                <FieldError errors={errors.description.map((message) => ({ message }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="collection-visibility">Visibility</FieldLabel>
                <Select
                  items={visibilities}
                  value={visibility}
                  onValueChange={(value) => {
                    if (typeof value === "string") setVisibility(value);
                  }}
                >
                  <SelectTrigger id="collection-visibility" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilities.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="collection-comments">Allow comments</FieldLabel>
                  <FieldDescription>Members can comment on its pages.</FieldDescription>
                </FieldContent>
                <Switch
                  id="collection-comments"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="collection-notify" checked={notify} onCheckedChange={setNotify} />
                <FieldLabel htmlFor="collection-notify">Notify members</FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </main>
    </Dialog>
  );
}

/** The page, with the button that opens the form. */
export const Page: Story = { render: () => <Workspace /> };

/** The form, open. */
export const Open: Story = { render: () => <Workspace defaultOpen /> };

/** The form after an empty submit: the name's error shows. */
export const Invalid: Story = { render: () => <Workspace defaultOpen defaultSubmitted /> };
