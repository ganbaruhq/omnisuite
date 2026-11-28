import type { Html } from "@effect/ui/html";

// Tabler Icons 3.52.0 outline paths (MIT, https://tabler.io/icons).
export const MarkupIcon = <Msg>(
  h: Pick<Html.H<Msg>, "svg" | "path">,
  name: "chevron-right" | "dots",
) =>
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
    .children(
      (name === "chevron-right"
        ? ["M9 6l6 6l-6 6"]
        : [
            "M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
            "M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
            "M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
          ]
      ).map((d) => h.path.attr("d", d)),
    );
