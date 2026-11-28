import { textVariants } from "@omnisuite/ui/lib/recipes/text";
import type { Html } from "@effect/ui/html";
import { styledSlot } from "@omnisuite/ui/effect/lib/styled";
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

export const Page = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "page", ...pageClasses);
};

export const PageFullBleed = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "page-full-bleed", ...pageFullBleedClasses).attrs({
    "data-full-bleed": "",
  });
};

export const PageHeader = <Msg>(
  h: Pick<Html.H<Msg>, "header">,
  options: { element?: Html.H<Msg>["header"] } = {},
) => {
  return styledSlot(options.element ?? h.header, "page-header", ...pageHeaderClasses);
};

export const PageHeading = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "page-heading", ...pageHeadingClasses);
};

export const PageTitle = <Msg>(
  h: Pick<Html.H<Msg>, "h1">,
  options: { element?: Html.H<Msg>["h1"] } = {},
) => {
  return styledSlot(
    options.element ?? h.h1,
    "page-title",
    ...pageTitleClasses,
    textVariants({ variant: "heading", size: "lg" }),
  ).attr("data-variant", "heading");
};

export const PageDescription = <Msg>(
  h: Pick<Html.H<Msg>, "p">,
  options: { element?: Html.H<Msg>["p"] } = {},
) => {
  return styledSlot(
    options.element ?? h.p,
    "page-description",
    ...pageDescriptionClasses,
    textVariants({ variant: "secondary" }),
  ).attr("data-variant", "secondary");
};

export const PageActions = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "page-actions", ...pageActionsClasses);
};

export const PageSection = <Msg>(
  h: Pick<Html.H<Msg>, "section">,
  options: { element?: Html.H<Msg>["section"] } = {},
) => {
  return styledSlot(options.element ?? h.section, "page-section", ...pageSectionClasses);
};

export const PageSectionTitle = <Msg>(
  h: Pick<Html.H<Msg>, "h2">,
  options: { element?: Html.H<Msg>["h2"] } = {},
) => {
  return styledSlot(
    options.element ?? h.h2,
    "page-section-title",
    ...pageSectionTitleClasses,
    textVariants({ variant: "heading" }),
  ).attr("data-variant", "heading");
};

export const PageBody = <Msg>(
  h: Pick<Html.H<Msg>, "div">,
  options: { element?: Html.H<Msg>["div"] } = {},
) => {
  return styledSlot(options.element ?? h.div, "page-body", ...pageBodyClasses);
};

export const PageAside = <Msg>(
  h: Pick<Html.H<Msg>, "aside">,
  options: { element?: Html.H<Msg>["aside"] } = {},
) => {
  return styledSlot(options.element ?? h.aside, "page-aside", ...pageAsideClasses);
};

export const PageAsideContent = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "page-aside-content", ...pageAsideContentClasses);
