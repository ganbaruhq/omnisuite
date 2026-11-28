import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@omnisuite/ui/lib/recipes/button";
import { cn } from "cn";
import { TextMorph } from "@omnisuite/ui/components/text-morph";
import {
  EASE_OUT,
  interactionIcon,
  useInteractionReducedMotion,
} from "@omnisuite/ui/lib/ui-interaction-motion";

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
