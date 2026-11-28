// One height per size name for every control that sits in a form row, so a
// Button, Input, Select, NativeSelect, InputGroup, Combobox and Toggle of the
// same `size` line up. Mirrors the Button scale in `recipes/button.ts`:
//   xs 24 · sm 28 · default 32 · md 36 · lg 40
// Change a height here and in `buttonVariants` / `toggleVariants` together.
export type ControlSize = "xs" | "sm" | "default" | "md" | "lg";

// The size sets variables and one utility per property reads them, rather than
// one `data-[size=…]:h-*` per size: a caller's `className="h-9"` or a
// component's own `has-[…]:h-auto` then overrides the height at every size,
// not only at the default. Needs `data-size` on the element; without it the
// control is the default size.
//   --control-height  24 · 28 · 32 · 36 · 40
//   --control-px      8 · 8 · 10 · 12 · 14   side padding, as Button's `px-*`
// The variables inherit, so a wrapper can set them for parts that are not the
// control itself (NativeSelect's icon, InputGroup's addons and inner input).
export const controlSizeVars =
  "[--control-height:calc(var(--spacing)*8)] [--control-px:calc(var(--spacing)*2.5)] data-[size=xs]:[--control-height:calc(var(--spacing)*6)] data-[size=xs]:[--control-px:calc(var(--spacing)*2)] data-[size=sm]:[--control-height:calc(var(--spacing)*7)] data-[size=sm]:[--control-px:calc(var(--spacing)*2)] data-[size=md]:[--control-height:calc(var(--spacing)*9)] data-[size=md]:[--control-px:calc(var(--spacing)*3)] data-[size=lg]:[--control-height:calc(var(--spacing)*10)] data-[size=lg]:[--control-px:calc(var(--spacing)*3.5)]";

// Height and corner radius. Side padding is left to each control, which reads
// `--control-px` where its own layout needs it.
export const controlSizeClasses = `${controlSizeVars} h-(--control-height) data-[size=lg]:rounded-lg`;
