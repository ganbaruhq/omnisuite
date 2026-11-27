import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { TextMorph } from "@omnisuite/ui/components/text-morph";
import {
  EASE_OUT,
  interactionIcon,
  useInteractionReducedMotion,
} from "@omnisuite/ui/lib/ui-interaction-motion";

// Based on Hairline UI button (MIT) https://hairlineui.com/ui/button
// Visual style from AlignUI v1.2 buttons: flat fills, inset 1px rings, a
// shadow-sm only on the resting stroke button, and a two-ring focus shadow
// (2px gap + 4px tint) instead of an outline. Variant mapping:
//   default → primary/filled   outline → neutral/stroke   secondary → neutral/lighter
//   ghost → neutral/ghost      destructive → error/filled
// Keeps the base-ui primitive and the existing variant/size names.
//
// Every variant has shadcn base-mira's `border border-transparent
// bg-clip-padding`, so all share one box: a fill stops 1px inside it (a solid
// button doesn't read larger than a stroke one), and the stroke variant just
// colours that border. Hover fills that drop the stroke recolour the border to
// the fill so the button doesn't shrink by 1px.

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap select-none",
    "outline-none transition duration-200 ease-out",
    "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground/60 disabled:border-transparent disabled:shadow-none",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Icons sit half a step into the padding, as AlignUI's -mx-1 icon slot does.
    "[&>[data-icon=inline-start]]:-ml-0.5 [&>[data-icon=inline-end]]:-mr-0.5",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary),black_15%)] focus-visible:shadow-button-primary-focus",
        outline:
          "border-border bg-background text-muted-foreground shadow-xs hover:border-muted hover:bg-muted hover:text-foreground hover:shadow-none focus-visible:border-foreground focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:border-muted aria-expanded:bg-muted aria-expanded:text-foreground aria-expanded:shadow-none",
        secondary:
          "bg-muted text-muted-foreground hover:border-border hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:border-foreground focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:border-border aria-expanded:bg-background aria-expanded:text-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-foreground focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-button-important-focus aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-[color-mix(in_oklab,var(--destructive),black_15%)] focus-visible:shadow-button-error-focus",
        link: "h-auto rounded-sm bg-transparent p-0 text-primary hover:underline focus-visible:underline",
      },
      // AlignUI heights: lg = medium (40), md = small (36), default = xsmall (32),
      // sm = xxsmall (28); xs (24) is ours.
      size: {
        default: "h-8 gap-2 px-2.5 text-sm",
        xs: "h-6 gap-1.5 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-7 gap-2 px-2 text-sm",
        md: "h-9 gap-2 px-3 text-sm [&_svg:not([class*='size-'])]:size-4.5",
        lg: "h-10 gap-2 rounded-lg px-3.5 text-sm [&_svg:not([class*='size-'])]:size-5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-7",
        "icon-lg": "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ActionStatus = "idle" | "pending" | "success" | "error";

const DEFAULT_LABELS: Record<ActionStatus, string> = {
  idle: "Save",
  pending: "Saving",
  success: "Saved",
  error: "Try again",
};

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shorthand for status="pending". */
    loading?: boolean;
    /** Async state: shows an icon slot and morphs the label. Needs string children. */
    status?: ActionStatus;
    statusLabels?: Partial<Record<ActionStatus, string>>;
    /** Reset to idle after success/error (ms). Needs `onReset`. */
    resetAfter?: number;
    onReset?: () => void;
  };

function SelfDrawingCheck({ drawn, reduced }: { drawn: boolean; reduced: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-full">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{
          strokeDashoffset: drawn ? 0 : 1,
          transition: drawn && !reduced ? `stroke-dashoffset 420ms ${EASE_OUT} 100ms` : "none",
        }}
      />
    </svg>
  );
}

function StatusAlert() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-full">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.75v3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function StatusButtonContent({
  status,
  idleLabel,
  statusLabels,
  reduced,
}: {
  status: ActionStatus;
  idleLabel: string;
  statusLabels?: Partial<Record<ActionStatus, string>> | undefined;
  reduced: boolean;
}) {
  const label = status === "idle" ? idleLabel : (statusLabels?.[status] ?? DEFAULT_LABELS[status]);
  const icons: Record<ActionStatus, React.ReactNode> = {
    idle: null,
    pending: (
      <span
        className={cn(
          "block size-full rounded-full border-[1.5px] border-current border-t-transparent opacity-85 motion-reduce:animate-none",
          status === "pending" && "animate-spin",
        )}
      />
    ),
    success: <SelfDrawingCheck drawn={status === "success"} reduced={reduced} />,
    error: <StatusAlert />,
  };
  const open = status !== "idle";
  return (
    <>
      <span
        aria-hidden="true"
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={{
          width: open ? "1em" : 0,
          height: "1em",
          marginRight: open ? "0.4em" : 0,
          transition: reduced ? "none" : `width 360ms ${EASE_OUT}, margin-right 360ms ${EASE_OUT}`,
        }}
      >
        {(Object.keys(icons) as ActionStatus[]).map((key) => (
          <span
            key={key}
            className="absolute inset-0 flex items-center justify-center"
            style={interactionIcon(key === status, reduced)}
          >
            {icons[key]}
          </span>
        ))}
      </span>
      <TextMorph>{label}</TextMorph>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </>
  );
}

type ButtonBaseProps = Omit<ButtonProps, "variant"> & {
  /** Resolved variant classes (from a cva recipe, className already merged). */
  styles: string;
};

/**
 * Shared behaviour for `Button` and `FancyButton`: async status label and
 * icon, error shake, auto-reset. Each wrapper only supplies its own styles.
 */
function ButtonBase({
  styles,
  size = "default",
  loading,
  status,
  statusLabels,
  resetAfter = 1800,
  onReset,
  disabled,
  children,
  ...props
}: ButtonBaseProps) {
  const reduced = useInteractionReducedMotion();
  const ref = React.useRef<HTMLElement | null>(null);
  const current: ActionStatus = status ?? (loading ? "pending" : "idle");
  const isAsync = status !== undefined || loading !== undefined;

  React.useEffect(() => {
    if ((current !== "success" && current !== "error") || !onReset) return;
    const timer = window.setTimeout(onReset, resetAfter);
    return () => window.clearTimeout(timer);
  }, [current, onReset, resetAfter]);

  React.useEffect(() => {
    if (current !== "error" || reduced) return;
    ref.current?.animate(
      [
        { transform: "none" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(-2px)" },
        { transform: "none" },
      ],
      { duration: 380, easing: "ease-out" },
    );
  }, [current, reduced]);

  const busy = current === "pending";

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      data-size={size}
      disabled={disabled}
      aria-busy={busy || undefined}
      className={cn(
        styles,
        current === "error" && "bg-destructive text-white",
        busy && "pointer-events-none",
      )}
      {...props}
    >
      {isAsync && typeof children === "string" ? (
        <StatusButtonContent
          status={current}
          idleLabel={children}
          statusLabels={statusLabels}
          reduced={reduced}
        />
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <ButtonBase size={size} styles={buttonVariants({ variant, size, className })} {...props} />
  );
}

export { Button, ButtonBase, buttonVariants };
export type { ActionStatus, ButtonBaseProps, ButtonProps };
