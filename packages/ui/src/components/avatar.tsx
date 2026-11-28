import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "cn";
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

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg" | "20" | "24" | "32" | "40" | "48" | "56" | "64" | "72" | "80";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(avatarClasses, className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(avatarImageClasses, className)}
      {...props}
    />
  );
}

function AvatarFallback({
  children,
  className,
  color = "gray",
  ...props
}: AvatarPrimitive.Fallback.Props & VariantProps<typeof avatarFallbackVariants>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-color={color}
      className={cn(avatarFallbackVariants({ color }), className)}
      {...props}
    >
      {children ?? (
        <svg
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
          className={avatarPlaceholderClasses}
        >
          <ellipse
            cx="40"
            cy="78"
            rx="32"
            ry="24"
            fill="var(--color-avatar-placeholder)"
            fillOpacity="0.72"
          />
          <circle cx="40" cy="32" r="16" fill="var(--color-avatar-placeholder)" fillOpacity="0.9" />
        </svg>
      )}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="avatar-badge" className={cn(avatarBadgeClasses, className)} {...props} />;
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="avatar-group" className={cn(avatarGroupClasses, className)} {...props} />;
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(avatarGroupCountClasses, className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge };
