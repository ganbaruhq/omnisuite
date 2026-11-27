import { Schema } from "effect";
import { Id } from "./schema.js";

interface CalendarNodeFields<TData> {
  readonly id: string;
  readonly title: string;
  readonly data?: TData;
  /** Omitted or null for a root. Every supplied parent must also be in the input. */
  readonly parentId?: string | null;
  /**
   * The node has children that the application loads when the viewer first expands it, such as
   * the rooms of a floor. It is expandable before any child is loaded and starts collapsed, and
   * the calendar asks for its children through `resourceLoading.onLoad`. Leave it out for a node whose
   * children are all supplied, or that has none.
   */
  readonly lazyChildren?: boolean;
}

/** An event target that may also contain child resources. */
export interface CalendarResourceInput<TData = unknown> extends CalendarNodeFields<TData> {
  readonly kind?: "resource";
}

/** An organizational heading that may contain groups or resources, but owns no events. */
export interface CalendarGroupInput<TData = unknown> extends CalendarNodeFields<TData> {
  readonly kind: "group";
}

export type CalendarNodeInput<TData = unknown> =
  | CalendarResourceInput<TData>
  | CalendarGroupInput<TData>;

export interface CalendarResource<TData = unknown> {
  readonly kind: "resource";
  readonly id: string;
  readonly title: string;
  readonly data: TData | undefined;
  readonly parentId: string | null;
  readonly lazyChildren: boolean;
}

export interface CalendarGroup<TData = unknown> extends Omit<CalendarResource<TData>, "kind"> {
  readonly kind: "group";
}

export type CalendarNode<TData = unknown> = CalendarResource<TData> | CalendarGroup<TData>;

export const CalendarNodeSchema = Schema.Struct({
  id: Id,
  title: Schema.String,
  data: Schema.optional(Schema.Unknown),
  kind: Schema.optional(Schema.Literals(["resource", "group"])),
  parentId: Schema.optional(Schema.NullOr(Id)),
  lazyChildren: Schema.optional(Schema.Boolean),
});

export const calendarNodeOf = <TData>(
  input: Schema.Schema.Type<typeof CalendarNodeSchema>,
): CalendarNode<TData> => ({
  id: input.id,
  title: input.title,
  data: input.data as TData | undefined,
  kind: input.kind ?? "resource",
  parentId: input.parentId ?? null,
  lazyChildren: input.lazyChildren ?? false,
});
