"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { IconCheck, IconUser, IconX } from "@tabler/icons-react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@omnisuite/ui/components/avatar";

// Adapted from Untitled UI tags (MIT) https://www.untitledui.com/react/components/tags
// Untitled builds on React Aria's TagGroup; we build on Base UI instead:
//   selectionMode "none"            → role="list" of static tags
//   selectionMode "single"/"multiple" → Base UI ToggleGroup (roving focus, aria-pressed)
// Leading content is composed, not configured: put a `TagAvatar` or `StatusDot`
// before the label and a `TagCount` after it. Padding adapts via `has-*`.
//
//   <TagGroup aria-label="Filters" selectionMode="multiple" onRemove={remove}>
//     <Tag value="design"><StatusDot status="success" />Design<TagCount>4</TagCount></Tag>
//   </TagGroup>

type TagSize = "sm" | "md" | "lg";
type TagSelectionMode = "none" | "single" | "multiple";

const TagGroupContext = React.createContext<{
  inGroup: boolean;
  size: TagSize;
  selectionMode: TagSelectionMode;
  disabled: boolean;
  onRemove?: ((value: string) => void) | undefined;
}>({ inGroup: false, size: "sm", selectionMode: "none", disabled: false });

const TagSizeContext = React.createContext<TagSize>("sm");

const tagVariants = cva(
  [
    "relative inline-flex w-fit shrink-0 items-center gap-0.75 rounded-md bg-background font-medium whitespace-nowrap text-foreground ring-1 ring-border ring-inset select-none dark:bg-input/30",
    "outline-ring outline-offset-2 has-[[data-slot=tag-toggle]:focus-visible]:outline-2",
    "has-[[data-slot=tag-count],[data-slot=tag-remove]]:pr-1",
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "px-2 py-0.75 text-xs/4.5 not-data-selectable:has-data-[slot=avatar]:pl-1 not-data-selectable:has-data-[slot=status-dot]:pl-1.5 data-selectable:pl-1.25",
        md: "px-2.25 py-0.5 text-sm/5 not-data-selectable:has-data-[slot=avatar]:pl-1.25 not-data-selectable:has-data-[slot=status-dot]:pl-1.75 data-selectable:pl-1",
        lg: "px-2.5 py-1 text-sm/5 not-data-selectable:has-data-[slot=avatar]:pl-1.75 not-data-selectable:has-data-[slot=status-dot]:pl-2.25 data-selectable:pl-1.25",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

const contentGap = { sm: "gap-1", md: "gap-1.25", lg: "gap-1.5" } as const;
const checkboxSize = {
  sm: "size-3.5 [&>svg]:size-2.5",
  md: "size-4 [&>svg]:size-3",
  lg: "size-4.5 [&>svg]:size-3.5",
} as const;
const countSize = { sm: "px-1 text-xs", md: "px-1.25 text-xs", lg: "px-1.5 text-sm" } as const;
const removeSize = {
  sm: { root: "p-0.5", icon: "size-2.5", stroke: 3.5 },
  md: { root: "p-0.5", icon: "size-3", stroke: 3 },
  lg: { root: "p-0.75", icon: "size-3.5", stroke: 2.75 },
} as const;

type TagGroupProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Size of every tag in the group. */
  size?: TagSize;
  /** `single` keeps one tag selected at all times; `multiple` allows any set. */
  selectionMode?: TagSelectionMode;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** Shows a remove button on every tag and enables Backspace/Delete on selectable tags. */
  onRemove?: (value: string) => void;
  disabled?: boolean;
};

function TagGroup({
  size = "sm",
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  onRemove,
  disabled = false,
  className,
  children,
  ...props
}: TagGroupProps) {
  const [internalValue, setInternalValue] = React.useState<readonly string[]>(defaultValue ?? []);
  const groupClassName = cn("flex flex-wrap gap-2", className);

  const handleValueChange = (next: string[]) => {
    if (selectionMode === "single" && next.length === 0) return;
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <TagGroupContext.Provider value={{ inGroup: true, size, selectionMode, disabled, onRemove }}>
      {selectionMode === "none" ? (
        <div data-slot="tag-group" role="list" className={groupClassName} {...props}>
          {children}
        </div>
      ) : (
        <ToggleGroupPrimitive
          data-slot="tag-group"
          multiple={selectionMode === "multiple"}
          value={value ?? internalValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          className={groupClassName}
          {...props}
        >
          {children}
        </ToggleGroupPrimitive>
      )}
    </TagGroupContext.Provider>
  );
}

type TagProps = Omit<React.ComponentProps<"span">, "onRemove"> & {
  /** Identifies the tag for selection and removal. Required inside a selectable or removable group. */
  value?: string;
  /** Overrides the group size; defaults to `sm` outside a group. */
  size?: TagSize;
  disabled?: boolean;
  /** Shows a remove button on this tag only. Takes precedence over the group's `onRemove`. */
  onRemove?: () => void;
};

function Tag({ value, size, disabled, onRemove, className, children, ...props }: TagProps) {
  const group = React.useContext(TagGroupContext);
  const resolvedSize = size ?? group.size;
  const isDisabled = disabled || group.disabled;
  const selectable = group.selectionMode !== "none";
  const contentId = React.useId();
  const removeId = React.useId();

  const remove =
    onRemove ?? (group.onRemove && value !== undefined ? () => group.onRemove?.(value) : undefined);

  const handleRemove = (from: HTMLElement) => {
    if (!remove || isDisabled) return;
    focusNeighbour(from);
    remove();
  };

  return (
    <TagSizeContext.Provider value={resolvedSize}>
      <span
        data-slot="tag"
        data-size={resolvedSize}
        data-selectable={selectable ? "" : undefined}
        data-disabled={isDisabled ? "" : undefined}
        role={group.inGroup && !selectable ? "listitem" : undefined}
        className={cn(tagVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {selectable ? (
          <TogglePrimitive
            data-slot="tag-toggle"
            id={contentId}
            value={value}
            disabled={isDisabled}
            onKeyDown={(event) => {
              if (event.key === "Backspace" || event.key === "Delete") {
                event.preventDefault();
                handleRemove(event.currentTarget);
              }
            }}
            className={cn(
              "group/tag-toggle inline-flex cursor-pointer items-center outline-none after:absolute after:inset-0 after:rounded-md disabled:cursor-not-allowed",
              contentGap[resolvedSize],
            )}
          >
            <TagCheckbox size={resolvedSize} />
            {children}
          </TogglePrimitive>
        ) : (
          <span id={contentId} className={cn("inline-flex items-center", contentGap[resolvedSize])}>
            {children}
          </span>
        )}
        {remove && (
          <button
            type="button"
            data-slot="tag-remove"
            id={removeId}
            aria-label="Remove"
            aria-labelledby={`${removeId} ${contentId}`}
            // Selectable tags remove with Backspace/Delete, so the button stays out of the tab order.
            tabIndex={selectable ? -1 : undefined}
            disabled={isDisabled}
            onClick={(event) => handleRemove(event.currentTarget)}
            className={cn(
              "relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
              removeSize[resolvedSize].root,
            )}
          >
            <IconX
              aria-hidden="true"
              className={removeSize[resolvedSize].icon}
              stroke={removeSize[resolvedSize].stroke}
            />
          </button>
        )}
      </span>
    </TagSizeContext.Provider>
  );
}

function TagCheckbox({ size }: { size: TagSize }) {
  return (
    <span
      aria-hidden="true"
      data-slot="tag-checkbox"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[4px] bg-background ring-1 ring-border ring-inset transition-colors duration-100",
        "group-data-pressed/tag-toggle:bg-primary group-data-pressed/tag-toggle:ring-primary",
        "group-data-disabled/tag-toggle:bg-muted",
        checkboxSize[size],
      )}
    >
      <IconCheck
        stroke={3}
        className="text-primary-foreground opacity-0 transition-opacity duration-100 group-data-pressed/tag-toggle:opacity-100"
      />
    </span>
  );
}

type TagAvatarProps = {
  src?: string;
  /** Empty by default: the tag label already names the person. */
  alt?: string;
  className?: string;
};

function TagAvatar({ src, alt = "", className }: TagAvatarProps) {
  return (
    <Avatar className={cn("size-4", className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback>
        <IconUser aria-hidden="true" className="size-3 text-muted-foreground" stroke={2.25} />
      </AvatarFallback>
    </Avatar>
  );
}

function TagCount({ className, ...props }: React.ComponentProps<"span">) {
  const size = React.useContext(TagSizeContext);
  return (
    <span
      data-slot="tag-count"
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] bg-muted font-medium text-foreground tabular-nums",
        countSize[size],
        className,
      )}
      {...props}
    />
  );
}

/** Moves focus to the nearest remaining tag so keyboard users are not dropped to <body>. */
function focusNeighbour(from: HTMLElement) {
  const tag = from.closest("[data-slot=tag]");
  const group = tag?.closest("[data-slot=tag-group]");
  if (!tag || !group) return;
  const targets = Array.from(group.querySelectorAll<HTMLElement>("[data-slot=tag]"))
    .map((el) =>
      el.querySelector<HTMLElement>(
        "[data-slot=tag-toggle]:not([disabled]), [data-slot=tag-remove]:not([disabled])",
      ),
    )
    .filter((el): el is HTMLElement => el !== null);
  const index = targets.findIndex((el) => tag.contains(el));
  const next = targets[index + 1] ?? targets[index - 1];
  if (next) requestAnimationFrame(() => next.isConnected && next.focus());
}

export { Tag, TagAvatar, TagCount, TagGroup, tagVariants };
export type { TagAvatarProps, TagGroupProps, TagProps, TagSelectionMode, TagSize };
