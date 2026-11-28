import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import { Drawer } from "@omnisuite/ui/effect/components/drawer";
import { Button } from "@omnisuite/ui/effect/components/button";
import { DrawerSnapPoint } from "@effect/ui-kit/Drawer";

const Message = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  Snapped: { snapPoint: DrawerSnapPoint },
});
export const drawerDemo = (example: "Default" | "Open" | "Disabled" | "WithSnapPoints" | "Right") =>
  Html.component({
    name: "DrawerDemo",
    model: Schema.Struct({ open: Schema.Boolean, snapPoint: Schema.NullOr(DrawerSnapPoint) }),
    message: Message,
  }).make({
    init: () => ({
      open: example !== "Default" && example !== "Disabled",
      snapPoint: example === "WithSnapPoints" ? 0.5 : null,
    }),
    update: {
      SetOpen: ($, { open }) => $.evolve({ open }),
      Snapped: ($, { snapPoint }) => $.evolve({ snapPoint }),
    },
    view: (h, model) => {
      return Drawer(h, {
        props: {
          open: model.open,
          snapPoint: model.snapPoint,
          snapPoints: example === "WithSnapPoints" ? [0.5, 1] : [],
          swipeDirection: example === "Right" ? "right" : "down",
        },
        onEmit: {
          RequestedOpen: () => Message.SetOpen({ open: true }),
          RequestedClose: () => Message.SetOpen({ open: false }),
          Settled: () => undefined,
          Snapped: ({ snapPoint }) => Message.Snapped({ snapPoint }),
        },
        view: (parts) =>
          h.div
            .class("p-10")
            .children(
              parts
                .trigger(
                  Button(h, { variant: "outline", props: { disabled: example === "Disabled" } }),
                )
                .children("Release notes"),
              parts.content(
                h,
                [
                  parts
                    .header(h.div)
                    .children(
                      parts.title(h.h2).children("Release notes"),
                      parts.description(h.p).children("What changed this week."),
                    ),
                  parts
                    .body(h.div)
                    .children("Drag the handle to snap the drawer, or swipe down to close."),
                  parts
                    .footer(h.div)
                    .children(parts.close(Button(h, { variant: "outline" })).children("Done")),
                ],
                { showSwipeHandle: true },
              ),
            ),
      });
    },
  });
