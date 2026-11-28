import { createStoreLogic } from "@xstate/store";
import type { TimelineRow } from "./timeline.js";

interface Expansion {
  readonly collapsedIds: ReadonlySet<string>;
  readonly expandedIds: ReadonlySet<string>;
}

/**
 * Expansion belongs to each viewer, separate from the supplied resources and events. A node is
 * open unless it is in `collapsedIds`, except a node with `lazyChildren`, which is closed until it
 * is in `expandedIds`. A viewer's choice is kept in whichever set it names, so it survives the
 * children arriving later and is never undone by them. Read the result with {@link collapsedIdsOf}.
 */
export const resourceHierarchyLogic = createStoreLogic({
  context: (): Expansion => ({ collapsedIds: new Set(), expandedIds: new Set() }),
  on: {
    /** Flips a node that is open by default. Use `setExpanded` for one with `lazyChildren`. */
    toggleExpanded: (context, event: { readonly id: string }) => {
      const collapsedIds = new Set(context.collapsedIds);
      if (collapsedIds.has(event.id)) collapsedIds.delete(event.id);
      else collapsedIds.add(event.id);
      return { ...context, collapsedIds };
    },
    setExpanded: (context, event: { readonly id: string; readonly expanded: boolean }) => {
      const collapsedIds = new Set(context.collapsedIds);
      const expandedIds = new Set(context.expandedIds);
      collapsedIds.delete(event.id);
      expandedIds.delete(event.id);
      (event.expanded ? expandedIds : collapsedIds).add(event.id);
      return { collapsedIds, expandedIds };
    },
  },
});

/**
 * The nodes that are collapsed now: those the viewer collapsed, and those with `lazyChildren`
 * that the viewer has not expanded. Pass it to `visibleTimelineRows`.
 */
export function collapsedIdsOf(
  rows: readonly Pick<TimelineRow, "hasChildren" | "resource">[],
  expansion: Expansion,
): ReadonlySet<string> {
  const collapsed = new Set(expansion.collapsedIds);
  for (const { hasChildren, resource } of rows)
    if (hasChildren && resource.lazyChildren && !expansion.expandedIds.has(resource.id))
      collapsed.add(resource.id);
  return collapsed;
}

/**
 * What pressing the disclosure of node `id` asks for, as a `setExpanded` event: to expand it when
 * it is collapsed now, and to collapse it otherwise. It asks nothing for a node that is not among
 * `rows` or has no children.
 */
export function expansionToggleOf(
  rows: readonly Pick<TimelineRow, "hasChildren" | "resource">[],
  collapsedIds: ReadonlySet<string>,
  id: string,
): { readonly id: string; readonly expanded: boolean } | undefined {
  if (!rows.some((row) => row.resource.id === id && row.hasChildren)) return undefined;
  return { id, expanded: collapsedIds.has(id) };
}
