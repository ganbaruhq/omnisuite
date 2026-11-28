import { MarkupIcon } from "@omnisuite/ui/effect/lib/markup-icons";
import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
import {
  breadcrumbListClasses,
  breadcrumbItemClasses,
  breadcrumbLinkClasses,
  breadcrumbPageClasses,
  breadcrumbSeparatorClasses,
  breadcrumbEllipsisClasses,
} from "@omnisuite/ui/lib/recipes/breadcrumb";

export const BreadcrumbList = <Msg>(
  h: Pick<Html.H<Msg>, "ol">,
  options: { element?: Html.H<Msg>["ol"] } = {},
) => {
  return styledSlot(options.element ?? h.ol, "breadcrumb-list", ...breadcrumbListClasses);
};

export const BreadcrumbItem = <Msg>(
  h: Pick<Html.H<Msg>, "li">,
  options: { element?: Html.H<Msg>["li"] } = {},
) => {
  return styledSlot(options.element ?? h.li, "breadcrumb-item", ...breadcrumbItemClasses);
};

export const BreadcrumbLink = <Msg>(
  h: Pick<Html.H<Msg>, "a">,
  options: { element?: Html.H<Msg>["a"] } = {},
) => {
  return styledSlot(options.element ?? h.a, "breadcrumb-link", ...breadcrumbLinkClasses);
};

export const BreadcrumbPage = <Msg>(
  h: Pick<Html.H<Msg>, "span">,
  options: { element?: Html.H<Msg>["span"] } = {},
) => {
  return styledSlot(options.element ?? h.span, "breadcrumb-page", ...breadcrumbPageClasses).attrs({
    role: "link",
    "aria-disabled": "true",
    "aria-current": "page",
  });
};

export const BreadcrumbSeparator = <Msg>(
  h: Pick<Html.H<Msg>, "li" | "svg" | "path">,
  options: { element?: Html.H<Msg>["li"] } = {},
) => {
  return styledSlot(options.element ?? h.li, "breadcrumb-separator", ...breadcrumbSeparatorClasses)
    .attrs({ role: "presentation", "aria-hidden": "true" })
    .children(MarkupIcon(h, "chevron-right"));
};

export const BreadcrumbEllipsis = <Msg>(
  h: Pick<Html.H<Msg>, "span" | "svg" | "path">,
  options: { element?: Html.H<Msg>["span"] } = {},
) => {
  return styledSlot(options.element ?? h.span, "breadcrumb-ellipsis", ...breadcrumbEllipsisClasses)
    .attrs({ role: "presentation", "aria-hidden": "true" })
    .children(MarkupIcon(h, "dots"), h.span.class("sr-only").children("More"));
};

export const Breadcrumb = <Msg>(h: Pick<Html.H<Msg>, "nav">) =>
  styledSlot(h.nav, "breadcrumb").attr("aria-label", "breadcrumb");
