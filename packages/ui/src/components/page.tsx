import * as React from "react";
import { cn } from "cn";
import { Text } from "./text";

/**
 * Page layout, modelled on the Cloudflare dashboard's `PageBase`.
 *
 * A three-track grid: two elastic gutters around a capped content track.
 *   [minmax(padding, 1fr)] [minmax(0, max-width)] [minmax(padding, 1fr)]
 * Gutters never shrink below `--page-padding-x`, and the content track never
 * grows past `--page-max-width`, so no wrapper `max-w-* mx-auto px-*` is needed.
 *
 * Children land in the centre track. A child with `data-full-bleed` spans all
 * three tracks (edge to edge); use `--page-bleed-gutter` inside it to pad its
 * content when it needs to stay aligned with the centre track.
 *
 * Override the width per page with a class, e.g. `[--page-max-width:50rem]`.
 */
function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page"
      className={cn(
        "grid grow auto-rows-min gap-y-7 py-8 [--page-bleed-gutter:var(--page-padding-x)] [--page-max-width:1400px] [--page-padding-x:--spacing(4)] md:[--page-padding-x:--spacing(8)]",
        "grid-cols-[minmax(var(--page-padding-x),1fr)_minmax(0,var(--page-max-width))_minmax(var(--page-padding-x),1fr)]",
        "*:col-start-2 *:data-full-bleed:col-span-full",
        className,
      )}
      {...props}
    />
  );
}

/** Edge-to-edge band inside a `Page`; its content is padded to the page gutter. */
function PageFullBleed({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-full-bleed"
      data-full-bleed=""
      className={cn("px-(--page-bleed-gutter)", className)}
      {...props}
    />
  );
}

function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    />
  );
}

function PageHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-heading"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

type PageTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  children?: React.ReactNode;
};

function PageTitle({ className, ...props }: PageTextProps) {
  return (
    <Text
      as="h1"
      variant="heading"
      size="lg"
      data-slot="page-title"
      className={cn(
        "flex items-center gap-2 tracking-tight [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: PageTextProps) {
  return (
    <Text
      variant="secondary"
      data-slot="page-description"
      className={cn("max-w-2xl text-pretty", className)}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("flex shrink-0 flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="page-section"
      className={cn("grid auto-rows-min gap-4", className)}
      {...props}
    />
  );
}

function PageSectionTitle({ className, ...props }: PageTextProps) {
  return (
    <Text
      as="h2"
      variant="heading"
      data-slot="page-section-title"
      className={cn("col-span-full", className)}
      {...props}
    />
  );
}

/**
 * Main column plus an optional side rail, like the Cloudflare dashboard.
 *
 *   <PageBody>
 *     <Page>…</Page>
 *     <PageAside>…</PageAside>
 *   </PageBody>
 *
 * The rail shows only when `PageBody` itself is at least 64rem wide (container
 * query), so a collapsed or expanded sidebar decides it, not the viewport.
 * Set `--page-header-height` on an ancestor to keep the rail's sticky content
 * below a sticky app header.
 */
function PageBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-body"
      className={cn("@container/page-body flex min-w-0 grow", className)}
      {...props}
    />
  );
}

function PageAside({ className, children, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="page-aside"
      className={cn("hidden w-100 shrink-0 border-l @5xl/page-body:block", className)}
      {...props}
    >
      <div className="sticky top-(--page-header-height,0px) flex flex-col gap-4 p-6">
        {children}
      </div>
    </aside>
  );
}

export {
  Page,
  PageActions,
  PageAside,
  PageBody,
  PageDescription,
  PageFullBleed,
  PageHeader,
  PageHeading,
  PageSection,
  PageSectionTitle,
  PageTitle,
};
