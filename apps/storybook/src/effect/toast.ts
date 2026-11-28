import { Command, UiSchema } from "@effect/ui";
import { Html } from "@effect/ui/html";
import { Effect, Schema } from "effect";
import { ToastProvider } from "@omnisuite/ui/effect/components/toast";
import { Button } from "@omnisuite/ui/effect/components/button";
import { Avatar } from "@omnisuite/ui/effect/components/avatar";
import { Icon } from "@omnisuite/ui/effect/lib/icons";
import { AVATAR_IMAGE } from "../story-data";

const Example = Schema.Literals(["Default", "Avatar", "Types", "WithAction", "Promise"]);
type Example = typeof Example.Type;
const Message = UiSchema.TaggedEnum({
  Show: { type: Schema.String },
  Synced: { id: Schema.String },
});
const Sync = Command.make("StorybookSync", { args: { id: Schema.String } }, ({ id }) =>
  Effect.succeed(Message.Synced({ id })).pipe(Effect.delay(2000)),
);
const Actions = Html.component({
  name: "ToastActions",
  props: Schema.Struct({ example: Example }),
  model: Schema.Struct({ count: Schema.Number }),
  message: Message,
}).make({
  init: () => ({ count: 0 }),
  update: {
    Show: ($, { type }) => {
      const id = `story-toast-${$.model.count + 1}`;
      const step = $.evolve({ count: $.model.count + 1 });
      switch ($.props.example) {
        case "Default":
          return step.send(ToastProvider.kit, {
            _tag: "RequestedAdd",
            toast: {
              id,
              title: "A new update is ready",
              description: "Explore the latest workspace tools and faster exports.",
            },
          });
        case "Avatar":
          return step.send(ToastProvider.kit, {
            _tag: "RequestedAdd",
            toast: {
              id,
              title: "Alex Morgan",
              description: "The collection is ready for your review. Let me know what you think!",
            },
          });
        case "Types":
          return step.send(ToastProvider.kit, {
            _tag: "RequestedAdd",
            toast: { id, type, title: `${type} toast`, description: "Sync finished." },
          });
        case "WithAction":
          return step.send(ToastProvider.kit, {
            _tag: "RequestedAdd",
            toast: { id, title: "Collection archived" },
          });
        case "Promise":
          return step
            .send(ToastProvider.kit, {
              _tag: "RequestedAdd",
              toast: { id, type: "loading", title: "Syncing…" },
            })
            .run(Sync.make({ id }));
      }
    },
    Synced: ($, { id }) =>
      $.send(ToastProvider.kit, {
        _tag: "RequestedUpdate",
        id,
        type: "success",
        title: "Synced",
        description: "1,204 records updated.",
      }),
  },
  view: (h) =>
    h.props.example === "Types"
      ? h.div
          .class("flex flex-wrap gap-2")
          .children(
            (["success", "info", "warning", "error", "loading"] as const).map((type) =>
              Button(h, { variant: "outline", onPress: Message.Show({ type }) }).children(type),
            ),
          )
      : Button(h, { variant: "outline", onPress: Message.Show({ type: "info" }) }).children(
          h.props.example === "Avatar"
            ? "Show avatar toast"
            : h.props.example === "WithAction"
              ? "Archive"
              : h.props.example === "Promise"
                ? "Sync now"
                : "Show toast",
        ),
});

export const toastDemo = (example: Example) =>
  Html.component({ name: "ToastDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) =>
      ToastProvider(h, {
        view: (provider) =>
          h.div.children(
            Actions(h, { props: { example } }),
            // Extra avatar/date/action content is consumer composition: Effect ToastData carries text only.
            provider.viewport(h.div).children(
              provider.toasts.map((toast) =>
                provider.root({ element: h.div, toast }).children(
                  provider.content({ element: h.div, toast }).children(
                    example === "Avatar"
                      ? Avatar(h, {
                          key: toast.id,
                          props: { src: AVATAR_IMAGE },
                          view: (avatar) =>
                            avatar
                              .root(h.span)
                              .children(
                                avatar.image(h.img.attr("alt", "Alex Morgan")),
                                avatar.fallback(h.span)?.children("AM"),
                              ),
                        })
                      : example === "Default"
                        ? h.span
                            .attr("data-slot", "toast-icon")
                            .attr("aria-hidden", "true")
                            .class("shrink-0")
                            .children(
                              h.svg
                                .attrs({
                                  viewBox: "0 0 24 24",
                                  width: "24",
                                  height: "24",
                                  fill: "none",
                                  stroke: "currentColor",
                                  "stroke-width": "2",
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round",
                                })
                                .class("size-4")
                                .children(
                                  // Tabler Cube 3.52.0 (MIT), matching React's IconCube.
                                  [
                                    "M21 16.008v-8.018a1.98 1.98 0 0 0 -1 -1.717l-7 -4.008a2.016 2.016 0 0 0 -2 0l-7 4.008c-.619 .355 -1 1.01 -1 1.718v8.018c0 .709 .381 1.363 1 1.717l7 4.008a2.016 2.016 0 0 0 2 0l7 -4.008c.619 -.355 1 -1.01 1 -1.718",
                                    "M12 22v-10",
                                    "M12 12l8.73 -5.04",
                                    "M3.27 6.96l8.73 5.04",
                                  ].map((d) => h.path.attr("d", d)),
                                ),
                            )
                        : provider.icon(h, toast),
                    h.div.class("flex min-w-0 flex-1 flex-col gap-1").children(
                      h.div
                        .class("flex flex-wrap items-baseline gap-x-2 gap-y-1")
                        .children(
                          provider.title({ element: h.div, toast }).children(toast.title ?? ""),
                          example === "Avatar"
                            ? h.span.class("text-xs text-muted-foreground").children("2 mins ago")
                            : null,
                        ),
                      toast.description === undefined
                        ? null
                        : provider
                            .description({ element: h.div, toast })
                            .children(toast.description),
                      h.div.class("mt-2 flex flex-wrap items-center gap-3").children(
                        example === "Default" || example === "Avatar" || example === "WithAction"
                          ? provider
                              .close({ element: Button(h, { variant: "link" }), toast })
                              .attr("data-slot", "toast-action")
                              .children(
                                example === "WithAction"
                                  ? "Undo"
                                  : example === "Avatar"
                                    ? "View collection"
                                    : "View update",
                              )
                          : null,
                        provider
                          .close({
                            element: Button(h, { variant: "link" }).class(
                              "h-auto p-0 font-semibold",
                            ),
                            toast,
                          })
                          .attr("aria-label", "Dismiss")
                          .children("Dismiss"),
                      ),
                    ),
                    provider
                      .close({
                        element: Button(h, { variant: "ghost", size: "icon-sm" }).class(
                          "absolute top-3 right-3",
                        ),
                        toast,
                      })
                      .attr("aria-label", "Close toast")
                      .children(Icon(h, "x")),
                  ),
                ),
              ),
            ),
          ),
      }),
  });
