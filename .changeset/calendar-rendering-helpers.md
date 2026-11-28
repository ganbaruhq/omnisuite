---
"@omnisuite/calendar-core": minor
"@omnisuite/calendar-react": patch
---

`@omnisuite/calendar-core` now owns the arithmetic and wording every renderer of the resource
timeline shares: `slotBoxOf` and `placementBoxOf` give the box of a slot or an occurrence in
percent; `laneLabelOf`, `disclosureLabelOf` and `disclosureDescriptionOf` give the accessible
names; `expansionToggleOf` gives the `setExpanded` event a disclosure asks for; and
`windowAttemptOf` and `isWindowRetry` tell which window signal is a retry.
`@omnisuite/calendar-react` uses them, with unchanged markup.
