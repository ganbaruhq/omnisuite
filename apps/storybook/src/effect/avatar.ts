import { Html } from "@effect/ui/html";
import { Schema } from "effect";
import {
  Avatar,
  AvatarPlaceholder,
  AvatarGroup,
  AvatarGroupCount,
} from "@omnisuite/ui/effect/components/avatar";
import { AVATAR_IMAGE } from "../story-data";

export const avatarDemo = (
  example: "TextContent" | "Placeholder" | "Sizes" | "Image" | "FailedImage" | "Group",
) =>
  Html.component({ name: "AvatarDemo", model: Schema.Struct({}), message: Schema.Never }).make({
    init: () => ({}),
    update: ($) => $.model,
    view: (h) => {
      switch (example) {
        case "TextContent":
          return h.div.class("flex flex-wrap items-center gap-4").children(
            (["gray", "yellow", "purple"] as const).map((color) =>
              Avatar(h, {
                key: color,
                props: {},
                view: (avatar) =>
                  avatar
                    .root(h.span, "80")
                    .attr("aria-label", `${color} text avatar`)
                    .children(avatar.fallback(h.span, color)?.children("EW")),
              }),
            ),
          );
        case "Placeholder":
          return h.div.class("flex flex-wrap items-center gap-6").children(
            (["gray", "yellow", "purple"] as const).map((color) =>
              Avatar(h, {
                key: color,
                props: {},
                view: (avatar) =>
                  avatar
                    .root(h.span, "80")
                    .attr("aria-label", `${color} avatar placeholder`)
                    .children(avatar.fallback(h.span, color)?.children(AvatarPlaceholder(h))),
              }),
            ),
          );
        case "Sizes":
          return h.div.class("flex flex-wrap items-center gap-4").children(
            (["20", "24", "32", "40", "48", "56", "64", "72", "80"] as const).map((size) =>
              Avatar(h, {
                key: size,
                props: {},
                view: (avatar) =>
                  avatar
                    .root(h.span, size)
                    .attr("aria-label", `Avatar ${size}`)
                    .children(avatar.fallback(h.span, "purple")?.children("EW")),
              }),
            ),
          );
        case "Image":
          return Avatar(h, {
            props: { src: AVATAR_IMAGE },
            view: (avatar) =>
              avatar
                .root(h.span, "80")
                .children(
                  avatar.image(h.img.attr("alt", "Emma Wilson")),
                  avatar.fallback(h.span, "purple")?.children("EW"),
                ),
          });
        case "FailedImage":
          return Avatar(h, {
            props: { src: "data:image/png;base64,invalid" },
            view: (avatar) =>
              avatar
                .root(h.span, "80")
                .attr("aria-label", "Emma Wilson")
                .children(
                  avatar.image(h.img.attr("alt", "Emma Wilson")),
                  avatar.fallback(h.span, "purple")?.children("EW"),
                ),
          });
        case "Group":
          return AvatarGroup(h).children(
            ["EW", "OR", "AM"].map((initials) =>
              Avatar(h, {
                key: initials,
                props: {},
                view: (avatar) =>
                  avatar
                    .root(h.span)
                    .attr("aria-label", initials)
                    .children(avatar.fallback(h.span, "purple")?.children(initials)),
              }),
            ),
            AvatarGroupCount(h).children("+5"),
          );
      }
    },
  });
