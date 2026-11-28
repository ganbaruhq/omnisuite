import { cva } from "class-variance-authority";
export const statusDotVariants = cva("inline-block size-1.5 shrink-0 rounded-full", {
  variants: {
    status: {
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      info: "bg-info",
      neutral: "bg-muted-foreground/50",
    },
    pulse: {
      true: "animate-pulse motion-reduce:animate-none",
      false: "",
    },
  },
  defaultVariants: {
    status: "neutral",
    pulse: false,
  },
});
