import { cva } from "class-variance-authority";

export const avatarClasses =
  "group/avatar relative flex size-8 text-sm/5 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten has-[[data-slot=avatar-fallback]]:after:border-0 data-[size=20]:size-5 data-[size=20]:text-xs/4 data-[size=24]:size-6 data-[size=24]:text-xs/4 data-[size=32]:size-8 data-[size=40]:size-10 data-[size=40]:text-base/6 data-[size=lg]:text-base/6 data-[size=48]:size-12 data-[size=48]:text-lg/6 data-[size=56]:size-14 data-[size=56]:text-lg/6 data-[size=64]:size-16 data-[size=64]:text-2xl/8 data-[size=72]:size-18 data-[size=72]:text-2xl/8 data-[size=80]:size-20 data-[size=80]:text-2xl/8 data-[size=sm]:text-xs/4";

export const avatarImageClasses = "aspect-square size-full rounded-full object-cover";

export const avatarFallbackVariants = cva(
  "flex size-full items-center justify-center rounded-full text-center font-medium uppercase [font-size:inherit] [line-height:inherit]",
  {
    variants: {
      color: {
        gray: "bg-avatar-gray text-avatar-black",
        yellow: "bg-avatar-yellow text-avatar-yellow-foreground",
        blue: "bg-avatar-blue text-avatar-blue-foreground",
        sky: "bg-avatar-sky text-avatar-sky-foreground",
        purple: "bg-avatar-purple text-avatar-purple-foreground",
        red: "bg-avatar-red text-avatar-red-foreground",
      },
    },
    defaultVariants: { color: "gray" },
  },
);

/** The fallback's drawn head and shoulders, shown when it has no initials. */
export const avatarPlaceholderClasses = "size-full overflow-hidden rounded-full";

export const avatarBadgeClasses = [
  "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
  "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
  "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
  "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
] as const;

export const avatarGroupClasses =
  "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background";

export const avatarGroupCountClasses =
  "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs/relaxed text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3";
