import type { Html } from "@effect/ui/html";
import { Slider as KitSlider } from "@effect/ui-kit/Slider";
import { sliderThumbClasses } from "@omnisuite/ui/lib/recipes/slider";
import { restyle, stylePart, styleElementPart } from "@omnisuite/ui/effect/lib/styled";

const rootClasses = "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full";

const controlClasses =
  "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col";

const trackClasses =
  "relative grow overflow-hidden rounded-md bg-muted select-none data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1";

const rangeClasses =
  "bg-primary select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full";

export const Slider = restyle(KitSlider, (slider) => {
  const root = stylePart(slider.root, "slider", rootClasses);
  const control = stylePart(
    slider.control,
    "slider-control",
    controlClasses,
    "data-[orientation=horizontal]:min-h-3",
  );
  const track = stylePart(slider.track, "slider-track", trackClasses);
  const indicator = stylePart(
    slider.indicator,
    "slider-range",
    rangeClasses,
    "absolute data-[orientation=horizontal]:left-(--slider-indicator-start) data-[orientation=horizontal]:w-(--slider-indicator-size) data-[orientation=vertical]:bottom-(--slider-indicator-start) data-[orientation=vertical]:h-(--slider-indicator-size)",
  );
  const thumb = styleElementPart(
    slider.thumb,
    "slider-thumb",
    sliderThumbClasses,
    "absolute data-[orientation=horizontal]:left-(--slider-thumb-position) data-[orientation=horizontal]:top-1/2 data-[orientation=horizontal]:-translate-x-1/2 data-[orientation=horizontal]:-translate-y-1/2 data-[orientation=vertical]:bottom-(--slider-thumb-position) data-[orientation=vertical]:left-1/2 data-[orientation=vertical]:-translate-x-1/2 data-[orientation=vertical]:translate-y-1/2 has-[:focus-visible]:ring-2 data-disabled:pointer-events-none data-disabled:opacity-50",
  );
  return {
    ...slider,
    root,
    control,
    track,
    indicator,
    thumb,
    /** The track, range, and one labelled thumb per controlled value. */
    controlWithThumbs: <Msg>(
      h: Pick<Html.H<Msg>, "div" | "input">,
      options: {
        readonly labels: ReadonlyArray<string>;
        readonly element?: ReturnType<Html.H<Msg>["div"]["attr"]>;
        readonly input?: (index: number) => ReturnType<Html.H<Msg>["input"]["attr"]>;
      },
    ) =>
      root(options.element ?? h.div).children(
        control(h.div).children(
          track(h.div).children(indicator(h.div)),
          slider.values.map((_, index) =>
            thumb({
              element: h.div,
              input: (options.input?.(index) ?? h.input).attr(
                "aria-label",
                options.labels[index] ?? `Value ${index + 1}`,
              ),
              index,
            }),
          ),
        ),
      ),
  };
});
