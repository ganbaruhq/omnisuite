import { cva } from "class-variance-authority";
export const badgeVariants = cva(
  [
    "group/badge relative inline-flex w-fit shrink-0 items-center font-medium whitespace-nowrap ring-1 ring-inset",
    "bg-(--badge-bg) text-(--badge-fg) ring-(--badge-ring)",
    "outline-ring outline-offset-2 focus-visible:outline-2",
    "[&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:stroke-3 [&>svg]:text-(--badge-addon)",
    // StatusDot gets the same 8px box / 6px dot as BadgeDot.
    "[&>[data-slot=status-dot]]:size-2 [&>[data-slot=status-dot]]:border [&>[data-slot=status-dot]]:border-transparent [&>[data-slot=status-dot]]:bg-clip-padding",
    // Close button: same pr and gap at every shape.
    "has-data-[slot=badge-button]:gap-0.5",
  ],
  {
    variants: {
      variant: {
        "pill-color": "rounded-full",
        color: "rounded-sm",
        // Only the dot/icon takes the colour.
        modern:
          "rounded-sm bg-background text-badge-modern-foreground shadow-xs ring-badge-modern-ring",
      },
      color: {
        gray: "",
        brand: "",
        error: "",
        warning: "",
        success: "",
        slate: "",
        sky: "",
        blue: "",
        indigo: "",
        purple: "",
        pink: "",
        orange: "",
      },
      size: {
        sm: "py-0.5 text-xs/4.5 has-data-[slot=badge-button]:pr-0.75 has-data-[icon=only]:p-1.25",
        md: "py-0.5 text-sm/5 has-data-[slot=badge-button]:pr-1 has-data-[icon=only]:p-1.5",
        lg: "py-1 text-sm/5 has-data-[slot=badge-button]:pr-1.5 has-data-[icon=only]:p-2",
      },
    },
    compoundVariants: [
      // Rounded rectangle (`color`, `modern`).
      {
        variant: ["color", "modern"],
        size: "sm",
        className: [
          "gap-1 px-1.5",
          "has-data-[icon]:gap-0.5 has-data-[icon=inline-start]:pr-2 has-data-[icon=inline-end]:pl-2",
          "has-data-[slot=badge-image]:pl-1",
        ],
      },
      {
        variant: ["color", "modern"],
        size: "md",
        className: [
          "gap-1.5 px-2",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-1.5 has-data-[icon=inline-end]:pr-1.5",
          "has-data-[slot=badge-image]:pl-1.5",
        ],
      },
      {
        variant: ["color", "modern"],
        size: "lg",
        className: [
          "gap-1.5 rounded-md px-2.5",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
          "has-data-[slot=badge-image]:pl-2",
        ],
      },
      // Pill. A leading dot (BadgeDot or StatusDot: data-slot ends in `dot`) tightens pl.
      {
        variant: "pill-color",
        size: "sm",
        className: [
          "gap-1 px-2 has-[[data-slot$=dot]]:pl-1.5",
          "has-data-[icon]:gap-0.5 has-data-[icon=inline-start]:pl-1.5 has-data-[icon=inline-end]:pr-1.5",
          "has-data-[slot=badge-image]:pl-0.75",
        ],
      },
      {
        variant: "pill-color",
        size: "md",
        className: [
          "gap-1.5 px-2.5 has-[[data-slot$=dot]]:pl-2",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
          "has-data-[slot=badge-image]:pl-1",
        ],
      },
      {
        variant: "pill-color",
        size: "lg",
        className: [
          "gap-1.5 px-3 has-[[data-slot$=dot]]:pl-2.5",
          "has-data-[icon]:gap-1 has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5",
          "has-data-[slot=badge-image]:pl-1.5",
        ],
      },
    ],
    defaultVariants: {
      variant: "pill-color",
      color: "gray",
      size: "md",
    },
  },
);

export const badgeDotClasses = [
  "size-2 shrink-0 rounded-full border border-transparent bg-(--badge-addon) bg-clip-padding",
];

export const badgeImageClasses = ["size-4 max-w-none shrink-0 rounded-full object-cover"];

export const badgeWithButtonClasses = [
  "flex shrink-0 cursor-pointer items-center justify-center rounded-[3px] p-0.5 text-(--badge-button) transition duration-100 ease-linear group-data-[variant=pill-color]/badge:rounded-full",
  "outline-ring hover:bg-(--badge-button-hover) hover:text-(--badge-addon) focus-visible:outline-2",
  "disabled:pointer-events-none disabled:opacity-50",
];
