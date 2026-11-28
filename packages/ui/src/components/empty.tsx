import {
  emptyClasses,
  emptyHeaderClasses,
  emptyMediaVariants,
  emptyTitleClasses,
  emptyDescriptionClasses,
  emptyContentClasses,
} from "@omnisuite/ui/lib/recipes/empty";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty" className={cn(...emptyClasses, className)} {...props} />;
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="empty-header" className={cn(...emptyHeaderClasses, className)} {...props} />
  );
}

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-title" className={cn(...emptyTitleClasses, className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(...emptyDescriptionClasses, className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="empty-content" className={cn(...emptyContentClasses, className)} {...props} />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
