import { cloneElement, createElement, type ElementType, type ReactElement, type Ref } from "react";

/**
 * Replaces the element a part renders. Give an element, which receives the part's props merged
 * over its own, or a function of the part's props that returns the element to render. A function
 * must spread every prop it is given (`ref`, handlers, ARIA attributes, `data-*` and `style`)
 * onto one element, or the part loses the behavior those props carry.
 */
export type Render<TProps> = ReactElement<any> | ((props: TProps) => ReactElement);

/** Hands one element to several refs. */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (element: T | null) => {
    for (const ref of refs)
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
  };
}

const isHandler = (name: string) => /^on[A-Z]/.test(name);

/**
 * The props of a replacement element and the props of the part, as one set. The part's props win
 * where both have a value, except that handlers of the same name both run (the element's first, and
 * the part's only if the event was not prevented), classes are joined, styles are merged with the
 * part's placement on top, and refs are all called.
 */
function mergeHostProps(own: Record<string, any>, part: Record<string, any>) {
  const merged: Record<string, any> = { ...own };
  for (const [name, value] of Object.entries(part)) {
    if (value === undefined) continue;
    const before = own[name];
    if (isHandler(name) && typeof before === "function" && typeof value === "function")
      merged[name] = (event: { defaultPrevented?: boolean }, ...rest: unknown[]) => {
        before(event, ...rest);
        if (!event?.defaultPrevented) value(event, ...rest);
      };
    else if (name === "className") merged[name] = [before, value].filter(Boolean).join(" ");
    else if (name === "style") merged[name] = { ...before, ...value };
    else if (name === "ref") merged[name] = before ? composeRefs(before, value) : value;
    else merged[name] = value;
  }
  return merged;
}

/** Renders `tag` with `props`, or the element `render` names in its place. */
export function renderHost(
  tag: ElementType,
  props: Record<string, any>,
  render: Render<any> | undefined,
) {
  if (render === undefined) return createElement(tag, props);
  if (typeof render === "function") return render(props);
  return cloneElement(render, mergeHostProps(render.props, props));
}
