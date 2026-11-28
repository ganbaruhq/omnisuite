---
"@omnisuite/calendar-core": minor
"@omnisuite/calendar-react": patch
---

`@omnisuite/calendar-core` now owns the editing wording and guards every renderer shares:
`PreviewDescription`, `previewDescriptionOf` and `describePreviewInEnglish` describe a preview;
`cancelMessageOf`, `unchangedMessageOf` and `untargetedMessageOf` say how a gesture went;
`editFingerprintOf` tells a changed event from a re-render; `evaluationKeyOf` tells a new result
from the same one; `editCapabilityOf` and `resizableEdgesOf` say what a gesture may change.
`@omnisuite/calendar-react` uses them, with unchanged behaviour and text, and still exports
`PreviewDescription`.
