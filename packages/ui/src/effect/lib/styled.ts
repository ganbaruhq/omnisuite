import type * as AsyncResult from "effect/reactivity/AsyncResult";
import type { Component, View } from "@effect/ui";
import { cn } from "cn";

type ClassValue = Parameters<typeof cn>[number];

/**
 * Puts our classes on a builder, merged with the caller's through `cn`, so a caller's class wins
 * over ours (`max-w-lg` replaces our `max-w-md`). The merge runs when the element is built, so it
 * also sees classes the caller chains after the call.
 */
export const styled = <B>(builder: B, ...classes: ReadonlyArray<ClassValue>): B =>
  (builder as unknown as View.ElementBuilder<unknown>).forward((node) =>
    View_withClass(node, cn(...classes, node.elementAttrs.class as ClassValue)),
  ) as unknown as B;

const View_withClass = <N extends View.ElementBuilder<unknown>>(node: N, value: string): N =>
  (node as unknown as { attr: (name: string, value: string | undefined) => N }).attr(
    "class",
    value === "" ? undefined : value,
  );

/**
 * The kit draws positioners and toast viewports as popovers, which the browser gives a border,
 * padding, a background and `overflow: auto`. Ours style the popup inside, so this clears those.
 */
export const popoverReset = "border-0 bg-transparent p-0 overflow-visible text-inherit";

/** A part that takes a builder first, as most kit parts do. */
type BuilderPart = (builder: never, ...args: never) => unknown;

/** Our classes and `data-slot` on a builder, before a kit part writes its own attributes. */
const slotted = <B>(builder: B, slot: string, classes: ReadonlyArray<ClassValue>): B =>
  styled(
    (builder as unknown as View.ElementBuilder<unknown>).attr("data-slot", slot),
    ...classes,
  ) as B;

/**
 * Wraps a kit part so the builder it is given gets our `data-slot` and classes first. The part
 * keeps its type, and its own attributes still win, as the kit documents.
 */
export const stylePart = <P extends BuilderPart>(
  part: P,
  slot: string,
  ...classes: ReadonlyArray<ClassValue>
): P =>
  Object.assign(
    (builder: unknown, ...args: ReadonlyArray<unknown>) =>
      (part as unknown as (...a: ReadonlyArray<unknown>) => unknown)(
        slotted(builder, slot, classes),
        ...args,
      ),
    part,
  ) as unknown as P;

/** {@link stylePart} for a kit part that takes `{ element, ... }`, as Select's `item` and the toast parts do. */
export const styleElementPart = <P extends (options: never) => unknown>(
  part: P,
  slot: string,
  ...classes: ReadonlyArray<ClassValue>
): P =>
  Object.assign(
    (options: { readonly element: unknown }) =>
      (part as unknown as (o: unknown) => unknown)({
        ...options,
        element: slotted(options.element, slot, classes),
      }),
    part,
  ) as unknown as P;

/** A styled element of our own, for markup the kit has no part for (a dialog's header, a field group). */
export const styledSlot = <B>(builder: B, slot: string, ...classes: ReadonlyArray<ClassValue>): B =>
  slotted(builder, slot, classes);

// Every type parameter is inferred: a few are invariant, so `any` in their place doesn't match.
type HeadlessOf<C> =
  C extends Component.Headless<
    infer Props,
    infer Events,
    infer Parts,
    infer R,
    infer _Rcv,
    infer Sh,
    infer _SV,
    infer _Rp,
    infer _K
  >
    ? {
        readonly props: Props;
        readonly events: Events;
        readonly parts: Parts;
        readonly r: R;
        readonly sh: Sh;
      }
    : never;
type HeadlessParts<C> = HeadlessOf<C>["parts"];
type HeadlessProps<C> = HeadlessOf<C>["props"];
type HeadlessEvents<C> = HeadlessOf<C>["events"];
type HeadlessR<C> = HeadlessOf<C>["r"];
type HeadlessSh<C> = HeadlessOf<C>["sh"];

/**
 * A kit headless component with our styled parts: called exactly as the kit's, with the parts in
 * `view` already carrying our classes.
 */
export interface Styled<C, Parts> {
  <Msg, RV = never, RF = never>(
    h: View.HelperBase<Msg, unknown>,
    options: View.Child.Options<HeadlessProps<C>, HeadlessEvents<C>, NoInfer<Msg>> & {
      readonly fallback?:
        | ((result: AsyncResult.Failure<never, unknown>) => View.Content<NoInfer<Msg>, RF>)
        | undefined;
      readonly view: (parts: Parts) => View.Content<NoInfer<Msg>, RV>;
      readonly slots?: never;
    },
  ): View.Child<Msg, HeadlessR<C> | Exclude<RV, HeadlessSh<C>> | NoInfer<RF>>;
  /** The kit component underneath, for a `Scene`, `Story` or `childEmit` that names it. */
  readonly kit: C;
}

/**
 * Builds a {@link Styled} component from a kit headless component and a function over its parts.
 * `defaults` fills props the caller leaves out, such as our tooltip's `sideOffset`.
 */
export const restyle = <C, Parts>(
  component: C,
  style: (parts: HeadlessParts<C>) => Parts,
  defaults?: Partial<HeadlessProps<C>>,
): Styled<C, Parts> =>
  Object.assign(
    (h: unknown, options: { readonly props?: object; readonly view: (parts: Parts) => unknown }) =>
      (component as unknown as (h: unknown, options: unknown) => unknown)(h, {
        ...options,
        ...(defaults === undefined ? {} : { props: { ...defaults, ...options.props } }),
        view: (parts: HeadlessParts<C>) => options.view(style(parts)),
      }),
    { kit: component },
  ) as unknown as Styled<C, Parts>;
