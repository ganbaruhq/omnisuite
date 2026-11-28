import {
  pageClasses,
  pageFullBleedClasses,
  pageHeaderClasses,
  pageHeadingClasses,
  pageTitleClasses,
  pageDescriptionClasses,
  pageActionsClasses,
  pageSectionClasses,
  pageSectionTitleClasses,
  pageBodyClasses,
  pageAsideClasses,
  pageAsideContentClasses,
} from "@omnisuite/ui/lib/recipes/page";
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
  return <div data-slot="page" className={cn(...pageClasses, className)} {...props} />;
}

/** Edge-to-edge band inside a `Page`; its content is padded to the page gutter. */
function PageFullBleed({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-full-bleed"
      data-full-bleed=""
      className={cn(...pageFullBleedClasses, className)}
      {...props}
    />
  );
}

function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header data-slot="page-header" className={cn(...pageHeaderClasses, className)} {...props} />
  );
}

function PageHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-heading" className={cn(...pageHeadingClasses, className)} {...props} />
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
      className={cn(...pageTitleClasses, className)}
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: PageTextProps) {
  return (
    <Text
      variant="secondary"
      data-slot="page-description"
      className={cn(...pageDescriptionClasses, className)}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-actions" className={cn(...pageActionsClasses, className)} {...props} />
  );
}

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section data-slot="page-section" className={cn(...pageSectionClasses, className)} {...props} />
  );
}

function PageSectionTitle({ className, ...props }: PageTextProps) {
  return (
    <Text
      as="h2"
      variant="heading"
      data-slot="page-section-title"
      className={cn(...pageSectionTitleClasses, className)}
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
  return <div data-slot="page-body" className={cn(...pageBodyClasses, className)} {...props} />;
}

function PageAside({ className, children, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside data-slot="page-aside" className={cn(...pageAsideClasses, className)} {...props}>
      <div className={cn(...pageAsideContentClasses)}>{children}</div>
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
