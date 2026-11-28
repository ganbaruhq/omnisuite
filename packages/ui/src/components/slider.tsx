import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";
import {
  sliderClasses,
  sliderControlClasses,
  sliderTrackClasses,
  sliderRangeClasses,
  sliderThumbClasses,
} from "@omnisuite/ui/lib/recipes/slider";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn(sliderClasses, className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className={sliderControlClasses}>
        <SliderPrimitive.Track data-slot="slider-track" className={sliderTrackClasses}>
          <SliderPrimitive.Indicator data-slot="slider-range" className={sliderRangeClasses} />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={sliderThumbClasses}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
