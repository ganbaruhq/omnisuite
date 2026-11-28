import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Page,
  PageHeader,
  PageHeading,
  PageTitle,
  PageDescription,
  PageActions,
  PageBody,
  PageSection,
  PageSectionTitle,
  PageAside,
  PageAsideContent,
  PageFullBleed,
} from "@omnisuite/ui/effect/components/page";
import { Button } from "@omnisuite/ui/effect/components/button";

export const pageDemo = (example: "Default" | "WithAside" | "FullBleed") =>
  Html.component({ name: "PageDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Page(h).children(
            PageHeader(h).children(
              PageHeading(h).children(
                PageTitle(h).children("Collections"),
                PageDescription(h).children("Organize your workspace."),
              ),
              PageActions(h).children(Button(h).children("New collection")),
            ),
            PageBody(h).children(
              PageSection(h).children(
                PageSectionTitle(h).children("Recent"),
                h.p.children("Design system"),
              ),
              null,
            ),
            null,
          );
        case "WithAside":
          return Page(h).children(
            PageHeader(h).children(
              PageHeading(h).children(
                PageTitle(h).children("Collections"),
                PageDescription(h).children("Organize your workspace."),
              ),
              PageActions(h).children(Button(h).children("New collection")),
            ),
            PageBody(h).children(
              PageSection(h).children(
                PageSectionTitle(h).children("Recent"),
                h.p.children("Design system"),
              ),
              PageAside(h).children(PageAsideContent(h).children("24 components ready to use.")),
            ),
            null,
          );
        case "FullBleed":
          return Page(h).children(
            PageHeader(h).children(
              PageHeading(h).children(
                PageTitle(h).children("Collections"),
                PageDescription(h).children("Organize your workspace."),
              ),
              PageActions(h).children(Button(h).children("New collection")),
            ),
            PageBody(h).children(
              PageSection(h).children(
                PageSectionTitle(h).children("Recent"),
                h.p.children("Design system"),
              ),
              null,
            ),
            PageFullBleed(h).class("border-y p-6").children("Full width activity"),
          );
      }
    },
  });
