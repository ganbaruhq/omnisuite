import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@omnisuite/ui/effect/components/breadcrumb";

export const breadcrumbDemo = (example: "Default" | "Collapsed") =>
  Html.component({ name: "BreadcrumbDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "Default":
          return Breadcrumb(h).children(
            BreadcrumbList(h).children(
              BreadcrumbItem(h).children(
                BreadcrumbLink(h).attr("href", "#workspace").children("Workspace"),
              ),
              BreadcrumbSeparator(h),
              BreadcrumbItem(h).children(
                BreadcrumbLink(h).attr("href", "#collections").children("Collections"),
              ),
              BreadcrumbSeparator(h),
              BreadcrumbItem(h).children(BreadcrumbPage(h).children("Design system")),
            ),
          );
        case "Collapsed":
          return Breadcrumb(h).children(
            BreadcrumbList(h).children(
              BreadcrumbItem(h).children(
                BreadcrumbLink(h).attr("href", "#workspace").children("Workspace"),
              ),
              BreadcrumbSeparator(h),
              BreadcrumbItem(h).children(BreadcrumbEllipsis(h)),
              BreadcrumbSeparator(h),
              BreadcrumbItem(h).children(BreadcrumbPage(h).children("Design system")),
            ),
          );
      }
    },
  });
