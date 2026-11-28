import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Badge, BadgeDot } from "@omnisuite/ui/effect/components/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@omnisuite/ui/effect/components/breadcrumb";
import { Button } from "@omnisuite/ui/effect/components/button";
import { ButtonGroup, ButtonGroupSeparator } from "@omnisuite/ui/effect/components/button-group";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@omnisuite/ui/effect/components/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@omnisuite/ui/effect/components/empty";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@omnisuite/ui/effect/components/input-group";
import { Kbd, KbdGroup } from "@omnisuite/ui/effect/components/kbd";
import {
  LayerCard,
  LayerCardPrimary,
  LayerCardSecondary,
} from "@omnisuite/ui/effect/components/layer-card";
import {
  Page,
  PageHeader,
  PageHeading,
  PageTitle,
  PageDescription,
  PageSection,
} from "@omnisuite/ui/effect/components/page";
import { Separator } from "@omnisuite/ui/effect/components/separator";
import { Skeleton } from "@omnisuite/ui/effect/components/skeleton";
import { StatusDot } from "@omnisuite/ui/effect/components/status-dot";
import { Tag, TagContent, TagCount, TagGroup } from "@omnisuite/ui/effect/components/tag";
import { Text } from "@omnisuite/ui/effect/components/text";

const Message = UiSchema.TaggedEnum({ Filtered: { value: Schema.String }, ToggledArchive: {} });
const pages = [
  { name: "Tokens", description: "Colors, spacing and typography" },
  { name: "Components", description: "Reusable interface patterns" },
];

/** A standalone example page, composed entirely from workspace Effect exports. */
export const CollectionDetail = Html.component({
  name: "CollectionDetail",
  model: Schema.Struct({ query: Schema.String, archived: Schema.Boolean }),
  message: Message,
}).make({
  init: () => ({ query: "", archived: false }),
  update: {
    Filtered: ($, { value }) => $.evolve({ query: () => value }),
    ToggledArchive: ($) => $.evolve({ archived: (archived) => !archived }),
  },
  view: (h, model) => {
    const filtered = pages.filter((page) =>
      page.name.toLowerCase().includes(model.query.toLowerCase()),
    );
    return Page(h)
      .attr("id", "collection-detail")
      .children(
        Breadcrumb(h).children(
          BreadcrumbList(h).children(
            BreadcrumbItem(h).children(
              BreadcrumbLink(h).attr("href", "#collections").children("Collections"),
            ),
            BreadcrumbSeparator(h),
            BreadcrumbItem(h).children(BreadcrumbPage(h).children("Design system")),
          ),
        ),
        PageHeader(h).children(
          PageHeading(h).children(
            PageTitle(h).children("Design system"),
            PageDescription(h).children("The shared language behind every Omnisuite screen."),
          ),
          Badge(h, { color: model.archived ? "gray" : "success" }).children(
            BadgeDot(h),
            model.archived ? "Archived" : "Active",
          ),
        ),
        PageSection(h).children(
          LayerCard(h).children(
            LayerCardSecondary(h).children(
              StatusDot(h, { status: "success" }),
              Text(h, { variant: "secondary", size: "sm" }).children("Shared with the design team"),
            ),
            LayerCardPrimary(h)
              .class("gap-4")
              .children(
                Text(h, { variant: "heading" }).children("Collection overview"),
                Text(h).children(
                  "Guidelines, tokens and components for building consistent interfaces.",
                ),
                TagGroup(h)
                  .attr("aria-label", "Collection tags")
                  .children(
                    Tag(h)
                      .attr("role", "listitem")
                      .children(TagContent(h).children("Design", TagCount(h).children("2"))),
                  ),
                Separator(h),
                ButtonGroup(h)
                  .attr("aria-label", "Collection actions")
                  .children(
                    Button(h, { variant: "outline", onPress: Message.ToggledArchive() }).children(
                      model.archived ? "Restore collection" : "Archive collection",
                    ),
                    ButtonGroupSeparator(h),
                    Button(h, { variant: "outline", element: h.button.attr("type", "button") })
                      .attr("disabled", "")
                      .children("Share"),
                  ),
              ),
            LayerCardSecondary(h).children(
              Text(h, { variant: "mono-secondary" }).children("collection/design-system"),
            ),
          ),
          Card(h).children(
            CardHeader(h).children(
              CardTitle(h).children("Pages"),
              CardDescription(h).children("Find a page in this collection."),
            ),
            CardContent(h)
              .class("grid gap-4")
              .children(
                InputGroup(h, { size: "sm" }).children(
                  InputGroupInput(h, {
                    props: { value: model.query },
                    onUpdate: ({ value }) => Message.Filtered({ value }),
                  }).attrs({ "aria-label": "Filter pages", placeholder: "Filter pages" }),
                  InputGroupAddon(h, { align: "inline-end" }).children(
                    KbdGroup(h).children(Kbd(h).children("Search")),
                  ),
                ),
                filtered.map((page) =>
                  h.a
                    .attrs({ href: `#${page.name.toLowerCase()}`, "data-page-link": "" })
                    .class("grid gap-1 rounded-md border p-3 hover:bg-muted")
                    .children(
                      Text(h, { variant: "heading", as: "span" }).children(page.name),
                      Text(h, { variant: "secondary", size: "sm", as: "span" }).children(
                        page.description,
                      ),
                    ),
                ),
                filtered.length === 0
                  ? Empty(h).children(
                      EmptyHeader(h).children(
                        EmptyMedia(h, { variant: "icon" }).children("?"),
                        EmptyTitle(h).children("No matching pages"),
                        EmptyDescription(h).children("Try another page name."),
                      ),
                    )
                  : undefined,
              ),
            CardFooter(h).children(
              Text(h, { variant: "secondary", size: "xs" }).children(
                `${filtered.length} of ${pages.length} pages`,
              ),
            ),
          ),
          Card(h, { size: "sm" }).children(
            CardHeader(h).children(
              CardTitle(h).children("Activity preview"),
              CardDescription(h).children("Loading activity…"),
            ),
            CardContent(h)
              .attrs({ "aria-busy": "true", "aria-label": "Loading activity" })
              .class("grid gap-2")
              .children(Skeleton(h).class("h-3 w-2/3"), Skeleton(h).class("h-3 w-1/2")),
          ),
        ),
        // A static example of the collection's empty state is useful even with populated pages above.
        Empty(h).children(
          EmptyHeader(h).children(
            EmptyTitle(h).children("No pinned pages"),
            EmptyDescription(h).children("Pin important pages to keep them close."),
          ),
        ),
      );
  },
});
