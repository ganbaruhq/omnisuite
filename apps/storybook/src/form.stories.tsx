import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { IconAt, IconLayoutBoard, IconLayoutGrid, IconTable } from "@tabler/icons-react";
import { Button } from "@omnisuite/ui/components/button";
import { Checkbox } from "@omnisuite/ui/components/checkbox";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@omnisuite/ui/components/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@omnisuite/ui/components/field";
import { Input } from "@omnisuite/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@omnisuite/ui/components/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@omnisuite/ui/components/input-otp";
import { NativeSelect, NativeSelectOption } from "@omnisuite/ui/components/native-select";
import { RadioGroup, RadioGroupItem } from "@omnisuite/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@omnisuite/ui/components/select";
import { Slider } from "@omnisuite/ui/components/slider";
import { Switch } from "@omnisuite/ui/components/switch";
import { Textarea } from "@omnisuite/ui/components/textarea";
import { Toggle } from "@omnisuite/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@omnisuite/ui/components/toggle-group";
import type { ControlSize } from "@omnisuite/ui/lib/recipes/control";

const meta = {
  title: "React/Form/Form",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const ROLES = [
  { label: "Choose a role", value: null },
  { label: "Owner", value: "owner" },
  { label: "Editor", value: "editor" },
  { label: "Viewer", value: "viewer" },
];
const TIMEZONES = ["Asia/Ho_Chi_Minh", "Asia/Singapore", "Europe/London", "America/New_York"];
const TEAMS = ["Design", "Engineering", "Marketing", "Sales", "Support"];

/** Every shadcn input in one form, laid out with FieldSet / FieldGroup / Field. */
function KitchenSinkForm() {
  const teamsAnchor = useComboboxAnchor();
  const [seats, setSeats] = React.useState(12);
  const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue>>();

  return (
    <form
      className="flex w-full max-w-md flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Text inputs</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="form-name">Full name</FieldLabel>
              <Input id="form-name" name="name" placeholder="Olivia Rhye" />
            </Field>
            <Field>
              <FieldLabel htmlFor="form-email">Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <IconAt />
                </InputGroupAddon>
                <InputGroupInput
                  id="form-email"
                  name="email"
                  type="email"
                  placeholder="olivia@omnisuite.dev"
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-site">Website</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput id="form-site" name="site" placeholder="omnisuite.dev" />
              </InputGroup>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="form-handle">Handle</FieldLabel>
              <Input id="form-handle" name="handle" defaultValue="olivia rhye" aria-invalid />
              <FieldError>Handles can't contain spaces.</FieldError>
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="form-workspace">Workspace ID</FieldLabel>
              <Input id="form-workspace" defaultValue="ws_01HZX9" disabled />
              <FieldDescription>Set when the workspace was created.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-bio">Bio</FieldLabel>
              <Textarea id="form-bio" name="bio" placeholder="A few words about you" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Selects</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="form-role">Role · Select</FieldLabel>
              <Select name="role" items={ROLES}>
                <SelectTrigger id="form-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ROLES.map((role) => (
                      <SelectItem key={role.label} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-lang">Language · NativeSelect</FieldLabel>
              <NativeSelect id="form-lang" name="language" defaultValue="en">
                <NativeSelectOption value="en">English</NativeSelectOption>
                <NativeSelectOption value="vi">Tiếng Việt</NativeSelectOption>
                <NativeSelectOption value="ja">日本語</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-tz">Timezone · Combobox</FieldLabel>
              <Combobox items={TIMEZONES} defaultValue={TIMEZONES[0]}>
                <ComboboxInput id="form-tz" name="timezone" placeholder="Search timezone" />
                <ComboboxContent>
                  <ComboboxEmpty>No timezone found.</ComboboxEmpty>
                  <ComboboxList>
                    {(tz: string) => (
                      <ComboboxItem key={tz} value={tz}>
                        {tz}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-teams">Teams · Combobox multiple</FieldLabel>
              <Combobox multiple autoHighlight items={TEAMS} defaultValue={[TEAMS[0], TEAMS[1]]}>
                <ComboboxChips ref={teamsAnchor}>
                  <ComboboxValue>
                    {(values: string[]) => (
                      <>
                        {values.map((value) => (
                          <ComboboxChip key={value}>{value}</ComboboxChip>
                        ))}
                        <ComboboxChipsInput id="form-teams" placeholder="Add team" />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={teamsAnchor}>
                  <ComboboxEmpty>No teams found.</ComboboxEmpty>
                  <ComboboxList>
                    {(team: string) => (
                      <ComboboxItem key={team} value={team}>
                        {team}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Choices</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Layout · ToggleGroup</FieldLabel>
              <ToggleGroup variant="outline" defaultValue={["table"]} aria-label="Layout">
                <ToggleGroupItem value="table">
                  <IconTable />
                  Table
                </ToggleGroupItem>
                <ToggleGroupItem value="board">
                  <IconLayoutBoard />
                  Board
                </ToggleGroupItem>
                <ToggleGroupItem value="gallery">
                  <IconLayoutGrid />
                  Gallery
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Plan · RadioGroup</FieldLegend>
              <RadioGroup name="plan" defaultValue="team">
                {[
                  ["starter", "Starter"],
                  ["team", "Team"],
                  ["enterprise", "Enterprise"],
                ].map(([value, label]) => (
                  <Field key={value} orientation="horizontal">
                    <RadioGroupItem value={value!} id={`plan-${value}`} />
                    <FieldLabel htmlFor={`plan-${value}`} className="font-normal">
                      {label}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">Billing · RadioGroup cards</FieldLegend>
              <RadioGroup name="billing" defaultValue="yearly">
                {[
                  ["monthly", "Monthly", "Pay as you go, cancel anytime."],
                  ["yearly", "Yearly", "Two months free."],
                ].map(([value, title, description]) => (
                  <FieldLabel key={value} htmlFor={`billing-${value}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{title}</FieldTitle>
                        <FieldDescription>{description}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={value!} id={`billing-${value}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">Notify me about · Checkbox</FieldLegend>
              <FieldGroup className="gap-3">
                {[
                  ["mentions", "Mentions", true],
                  ["syncs", "Failed syncs", true],
                  ["digest", "Weekly digest", false],
                ].map(([id, label, checked]) => (
                  <Field key={String(id)} orientation="horizontal">
                    <Checkbox id={String(id)} name={String(id)} defaultChecked={Boolean(checked)} />
                    <FieldLabel htmlFor={String(id)} className="font-normal">
                      {String(label)}
                    </FieldLabel>
                  </Field>
                ))}
                <Field orientation="horizontal" data-disabled>
                  <Checkbox id="security" defaultChecked disabled />
                  <FieldLabel htmlFor="security" className="font-normal">
                    Security alerts (always on)
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </FieldSet>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="form-2fa">Two-factor auth · Switch</FieldLabel>
                <FieldDescription>Ask for a code at every sign-in.</FieldDescription>
              </FieldContent>
              <Switch id="form-2fa" name="twoFactor" defaultChecked />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Ranges and codes</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldTitle>Seats · Slider</FieldTitle>
              <Slider
                aria-label="Seats"
                value={[seats]}
                onValueChange={(value) => setSeats(Array.isArray(value) ? value[0]! : value)}
                min={1}
                max={50}
              />
              <FieldDescription>{seats} seats</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="form-otp">Verification code · InputOTP</FieldLabel>
              <InputOTP id="form-otp" name="code" maxLength={6}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </div>

      {submitted && (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </form>
  );
}

export const AllInputs: Story = { render: () => <KitchenSinkForm /> };

const CONTROL_SIZES: ControlSize[] = ["xs", "sm", "default", "md", "lg"];

/** Same `size`, same height: every control in a row should share its top and bottom edge. */
function ControlSizeRows() {
  return (
    <div className="flex flex-col gap-4">
      {CONTROL_SIZES.map((size) => (
        <div key={size} data-testid={`control-row-${size}`} className="flex items-center gap-2">
          <span className="w-14 font-mono text-xs text-muted-foreground">{size}</span>
          <Button size={size}>Save</Button>
          <Input size={size} aria-label={`Input ${size}`} placeholder="Input" className="w-28" />
          <InputGroup size={size} className="w-36">
            <InputGroupAddon>
              <IconAt aria-hidden />
            </InputGroupAddon>
            <InputGroupInput aria-label={`Input group ${size}`} placeholder="Group" />
          </InputGroup>
          <Select items={ROLES} defaultValue="owner">
            <SelectTrigger size={size} aria-label={`Select ${size}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROLES.map((role) => (
                  <SelectItem key={role.label} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <NativeSelect size={size} aria-label={`Native select ${size}`} defaultValue="en">
            <NativeSelectOption value="en">English</NativeSelectOption>
            <NativeSelectOption value="vi">Tiếng Việt</NativeSelectOption>
          </NativeSelect>
          <Combobox items={TIMEZONES} defaultValue={TIMEZONES[0]}>
            <ComboboxInput size={size} aria-label={`Combobox ${size}`} className="w-44" />
            <ComboboxContent>
              <ComboboxEmpty>No timezone found.</ComboboxEmpty>
              <ComboboxList>
                {(zone: string) => (
                  <ComboboxItem key={zone} value={zone}>
                    {zone}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Toggle size={size} variant="outline" aria-label={`Toggle ${size}`}>
            <IconTable aria-hidden />
          </Toggle>
        </div>
      ))}
    </div>
  );
}

export const ControlSizes: Story = { render: () => <ControlSizeRows /> };
