---
"@omnisuite/ui": minor
---

Give every form-row control the Button height scale, so the same `size` lines up across `Button`, `Input`, `InputGroup`, `SelectTrigger`, `NativeSelect`, `ComboboxInput` and `Toggle`: `xs` 24, `sm` 28, `default` 32, `md` 36, `lg` 40.

Breaking:

- The default height of `Input`, `InputGroup`, `SelectTrigger`, `NativeSelect`, `ComboboxInput`, `ComboboxChips` and `Toggle` grows from 28px to 32px. Pass `size="sm"` to keep 28px.
- `size="sm"` on `SelectTrigger`, `NativeSelect` and `Toggle` is now 28px; the old 24px size is `xs`. `Toggle`'s `lg` is now 40px; the old 32px size is `default`.
- `Input` takes `size` as a control size and no longer accepts the native numeric `size` attribute; set a width with `className`.
