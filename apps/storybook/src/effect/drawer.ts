import { UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { DrawerSnapPoint } from "@effect/ui-kit/Drawer";
import { Schema } from "effect";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Drawer } from "@omnisuite/ui/effect/components/drawer";

const Message = UiSchema.TaggedEnum({
  SetOpen: { open: Schema.Boolean },
  Snapped: { snapPoint: DrawerSnapPoint },
});

export const DrawerExample = Html.component({
  name: "DrawerExample",
  model: Schema.Struct({ open: Schema.Boolean, snapPoint: Schema.NullOr(DrawerSnapPoint) }),
  message: Message,
}).make({
  init: () => ({ open: false, snapPoint: null }),
  update: {
    SetOpen: ($, { open }) => $.evolve({ open }),
    Snapped: ($, { snapPoint }) => $.evolve({ snapPoint }),
  },
  view: (h, model) =>
    Drawer(h, {
      props: { open: model.open, snapPoint: model.snapPoint, snapPoints: [0.5, 1] },
      onEmit: {
        RequestedOpen: () => Message.SetOpen({ open: true }),
        RequestedClose: () => Message.SetOpen({ open: false }),
        Snapped: ({ snapPoint }) => Message.Snapped({ snapPoint }),
        Settled: () => undefined,
      },
      view: (drawer) =>
        h.div
          .class("p-10")
          .children(
            drawer.trigger(Button(h, { variant: "outline" })).children("Release notes"),
            drawer.content(
              h,
              [
                drawer
                  .header(h.div)
                  .children(
                    drawer.title(h.h2).children("Release notes"),
                    drawer.description(h.p).children("What changed this week."),
                  ),
                drawer
                  .body(h.div)
                  .children("Drag the handle to snap the drawer, or swipe down to close."),
                drawer.footer(h.div).children(drawer.close(Button(h)).children("Done")),
              ],
              { showSwipeHandle: true },
            ),
          ),
    }),
});
