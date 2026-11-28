import type { Html } from "@effect/ui/html";

// Outline icon paths copied from Tabler Icons 3.52.0 (MIT, https://tabler.io/icons), the set
// `@tabler/icons-react` draws for the React components. Copied rather than imported: the
// package's node data is one 2.3 MB JSON file.
const paths = {
  "layout-sidebar": ["M4 4h16v16h-16z", "M9 4v16"],
  x: ["M18 6l-12 12", "M6 6l12 12"],
  check: ["M5 12l5 5l10 -10"],
  "chevron-down": ["M6 9l6 6l6 -6"],
  "chevron-up": ["M6 15l6 -6l6 6"],
  selector: ["M8 9l4 -4l4 4", "M16 15l-4 4l-4 -4"],
  "circle-check": ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", "M9 12l2 2l4 -4"],
  "info-circle": ["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0", "M12 9h.01", "M11 12h1v4h1"],
  "alert-triangle": [
    "M12 9v4",
    "M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0",
    "M12 16h.01",
  ],
  "alert-octagon": [
    "M3 9.101v5.798c0 .53 .211 1.039 .586 1.415l4.1 4.1c.375 .375 .884 .586 1.415 .586h5.799c.53 0 1.039 -.211 1.414 -.586l4.1 -4.1c.375 -.375 .586 -.884 .586 -1.415v-5.798c0 -.53 -.211 -1.039 -.586 -1.415l-4.1 -4.1c-.375 -.375 -.884 -.586 -1.414 -.586l-5.799 0c-.53 0 -1.039 .211 -1.415 .586l-4.1 4.1c-.375 .375 -.586 .884 -.586 1.415",
    "M12 8v4",
    "M12 16h.01",
  ],
  loader: [
    "M12 6l0 -3",
    "M16.25 7.75l2.15 -2.15",
    "M18 12l3 0",
    "M16.25 16.25l2.15 2.15",
    "M12 18l0 3",
    "M7.75 16.25l-2.15 2.15",
    "M6 12l-3 0",
    "M7.75 7.75l-2.15 -2.15",
  ],
  "chevron-right": ["M9 6l6 6l-6 6"],
  dots: [
    "M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    "M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
  ],
  filter: [
    "M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227",
  ],
} as const;

/** The name of an icon {@link Icon} draws. */
export type IconName = keyof typeof paths;

/**
 * A Tabler outline icon as an inline `<svg>`, sized by CSS (`size-4` unless a parent's
 * `[&_svg]` rule says otherwise) and hidden from assistive technology.
 */
export const Icon = <Msg>(h: Pick<Html.H<Msg>, "svg" | "path">, name: IconName) =>
  h.svg
    .attrs({
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    })
    .class("tabler-icon", `tabler-icon-${name}`)
    .children(paths[name].map((d) => h.path.attr("d", d)));
