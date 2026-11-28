import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect } from "vite-plus/test";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@omnisuite/ui/components/card";
import { Badge, BadgeDot, BadgeImage } from "@omnisuite/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@omnisuite/ui/components/breadcrumb";
import { Kbd, KbdGroup } from "@omnisuite/ui/components/kbd";
import { Separator } from "@omnisuite/ui/components/separator";
import { Skeleton } from "@omnisuite/ui/components/skeleton";
import { Text } from "@omnisuite/ui/components/text";
import {
  Page,
  PageFullBleed,
  PageHeader,
  PageHeading,
  PageTitle,
  PageDescription,
  PageActions,
  PageSection,
  PageSectionTitle,
  PageBody,
  PageAside,
} from "@omnisuite/ui/components/page";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@omnisuite/ui/components/empty";
import { TagGroup, Tag, TagCount } from "@omnisuite/ui/components/tag";
import { StatusDot } from "@omnisuite/ui/components/status-dot";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "@omnisuite/ui/components/input-group";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@omnisuite/ui/components/button-group";
import {
  LayerCard,
  LayerCardPrimary,
  LayerCardSecondary,
} from "@omnisuite/ui/components/layer-card";
it("preserves React class output during recipe extraction", () => {
  expect(renderToStaticMarkup(createElement(Card, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Card",
  );
  expect(
    renderToStaticMarkup(createElement(CardHeader, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardHeader");
  expect(
    renderToStaticMarkup(createElement(CardTitle, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardTitle");
  expect(
    renderToStaticMarkup(createElement(CardDescription, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardDescription");
  expect(
    renderToStaticMarkup(createElement(CardAction, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardAction");
  expect(
    renderToStaticMarkup(createElement(CardContent, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardContent");
  expect(
    renderToStaticMarkup(createElement(CardFooter, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("CardFooter");
  expect(renderToStaticMarkup(createElement(Badge, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Badge",
  );
  expect(renderToStaticMarkup(createElement(BadgeDot, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "BadgeDot",
  );
  expect(
    renderToStaticMarkup(createElement(BadgeImage, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BadgeImage");
  expect(
    renderToStaticMarkup(createElement(Breadcrumb, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("Breadcrumb");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbList, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbList");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbItem, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbItem");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbLink, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbLink");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbPage, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbPage");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbSeparator, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbSeparator");
  expect(
    renderToStaticMarkup(createElement(BreadcrumbEllipsis, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("BreadcrumbEllipsis");
  expect(renderToStaticMarkup(createElement(Kbd, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Kbd",
  );
  expect(renderToStaticMarkup(createElement(KbdGroup, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "KbdGroup",
  );
  expect(
    renderToStaticMarkup(createElement(Separator, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("Separator");
  expect(renderToStaticMarkup(createElement(Skeleton, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Skeleton",
  );
  expect(renderToStaticMarkup(createElement(Text, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Text",
  );
  expect(renderToStaticMarkup(createElement(Page, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Page",
  );
  expect(
    renderToStaticMarkup(createElement(PageFullBleed, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageFullBleed");
  expect(
    renderToStaticMarkup(createElement(PageHeader, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageHeader");
  expect(
    renderToStaticMarkup(createElement(PageHeading, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageHeading");
  expect(
    renderToStaticMarkup(createElement(PageTitle, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageTitle");
  expect(
    renderToStaticMarkup(createElement(PageDescription, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageDescription");
  expect(
    renderToStaticMarkup(createElement(PageActions, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageActions");
  expect(
    renderToStaticMarkup(createElement(PageSection, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageSection");
  expect(
    renderToStaticMarkup(createElement(PageSectionTitle, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageSectionTitle");
  expect(renderToStaticMarkup(createElement(PageBody, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "PageBody",
  );
  expect(
    renderToStaticMarkup(createElement(PageAside, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("PageAside");
  expect(renderToStaticMarkup(createElement(Empty, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Empty",
  );
  expect(
    renderToStaticMarkup(createElement(EmptyHeader, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("EmptyHeader");
  expect(
    renderToStaticMarkup(createElement(EmptyMedia, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("EmptyMedia");
  expect(
    renderToStaticMarkup(createElement(EmptyTitle, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("EmptyTitle");
  expect(
    renderToStaticMarkup(createElement(EmptyDescription, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("EmptyDescription");
  expect(
    renderToStaticMarkup(createElement(EmptyContent, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("EmptyContent");
  expect(renderToStaticMarkup(createElement(TagGroup, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "TagGroup",
  );
  expect(renderToStaticMarkup(createElement(Tag, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "Tag",
  );
  expect(renderToStaticMarkup(createElement(TagCount, {})).match(/class="[^"]*"/g)).toMatchSnapshot(
    "TagCount",
  );
  expect(
    renderToStaticMarkup(createElement(StatusDot, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("StatusDot");
  expect(
    renderToStaticMarkup(createElement(InputGroup, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroup");
  expect(
    renderToStaticMarkup(createElement(InputGroupAddon, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroupAddon");
  expect(
    renderToStaticMarkup(createElement(InputGroupButton, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroupButton");
  expect(
    renderToStaticMarkup(createElement(InputGroupText, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroupText");
  expect(
    renderToStaticMarkup(createElement(InputGroupInput, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroupInput");
  expect(
    renderToStaticMarkup(createElement(InputGroupTextarea, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("InputGroupTextarea");
  expect(
    renderToStaticMarkup(createElement(ButtonGroup, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("ButtonGroup");
  expect(
    renderToStaticMarkup(createElement(ButtonGroupText, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("ButtonGroupText");
  expect(
    renderToStaticMarkup(createElement(ButtonGroupSeparator, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("ButtonGroupSeparator");
  expect(
    renderToStaticMarkup(createElement(LayerCard, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("LayerCard");
  expect(
    renderToStaticMarkup(createElement(LayerCardPrimary, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("LayerCardPrimary");
  expect(
    renderToStaticMarkup(createElement(LayerCardSecondary, {})).match(/class="[^"]*"/g),
  ).toMatchSnapshot("LayerCardSecondary");
});
