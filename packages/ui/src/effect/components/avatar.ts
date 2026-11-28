import type { Html } from "@effect/ui/html";
import { Avatar as KitAvatar, type AvatarSpan } from "@effect/ui-kit/Avatar";
import type { VariantProps } from "class-variance-authority";
import {
  avatarBadgeClasses,
  avatarClasses,
  avatarFallbackVariants,
  avatarGroupClasses,
  avatarGroupCountClasses,
  avatarImageClasses,
  avatarPlaceholderClasses,
} from "@omnisuite/ui/lib/recipes/avatar";
import { restyle, stylePart, styledSlot } from "@omnisuite/ui/effect/lib/styled";

export type AvatarSize =
  | "default"
  | "sm"
  | "lg"
  | "20"
  | "24"
  | "32"
  | "40"
  | "48"
  | "56"
  | "64"
  | "72"
  | "80";
export type AvatarColor = NonNullable<VariantProps<typeof avatarFallbackVariants>["color"]>;

/**
 * React's `Avatar`, on the kit's: called as the kit's, with `root(h.span, size)`,
 * `image(h.img)` and `fallback(h.span, color)` styled as React's `Avatar`, `AvatarImage` and
 * `AvatarFallback`, and `placeholder(h)` for the figure React's fallback draws without initials.
 * The kit loads the image through `HtmlImages.Images`.
 *
 * ```ts
 * Avatar(h, {
 *   props: { src: user.picture },
 *   view: (avatar) =>
 *     avatar.root(h.span).children(
 *       avatar.image(h.img.attr("alt", user.name)),
 *       avatar.fallback(h.span, "purple")?.children(user.initials),
 *     ),
 * })
 * ```
 */
export const Avatar = restyle(KitAvatar, (avatar) => ({
  ...avatar,
  root: <Msg, R = never>(element: AvatarSpan<Msg, R>, size: AvatarSize = "default") =>
    avatar.root(styledSlot(element, "avatar", avatarClasses).attr("data-size", size)),
  image: stylePart(avatar.image, "avatar-image", avatarImageClasses),
  fallback: <Msg, R = never>(element: AvatarSpan<Msg, R>, color: AvatarColor = "gray") =>
    avatar.fallback(
      styledSlot(element, "avatar-fallback", avatarFallbackVariants({ color })).attr(
        "data-color",
        color,
      ),
    ),
}));

/** The head and shoulders React's `AvatarFallback` draws when it has no children. */
export const AvatarPlaceholder = <Msg>(h: Pick<Html.H<Msg>, "svg" | "ellipse" | "circle">) =>
  h.svg
    .attrs({ viewBox: "0 0 80 80", fill: "none", "aria-hidden": "true" })
    .class(avatarPlaceholderClasses)
    .children(
      h.ellipse.attrs({
        cx: "40",
        cy: "78",
        rx: "32",
        ry: "24",
        fill: "var(--color-avatar-placeholder)",
        "fill-opacity": "0.72",
      }),
      h.circle.attrs({
        cx: "40",
        cy: "32",
        r: "16",
        fill: "var(--color-avatar-placeholder)",
        "fill-opacity": "0.9",
      }),
    );

/** React's `AvatarBadge`: the dot in an avatar's corner. */
export const AvatarBadge = <Msg>(h: Pick<Html.H<Msg>, "span">) =>
  styledSlot(h.span, "avatar-badge", avatarBadgeClasses);

/** React's `AvatarGroup`: overlapping avatars. */
export const AvatarGroup = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "avatar-group", avatarGroupClasses);

/** React's `AvatarGroupCount`: the "+N" at the end of a group. */
export const AvatarGroupCount = <Msg>(h: Pick<Html.H<Msg>, "div">) =>
  styledSlot(h.div, "avatar-group-count", avatarGroupCountClasses);
