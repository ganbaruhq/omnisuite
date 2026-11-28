---
"@omnisuite/calendar-core": minor
"@omnisuite/calendar-react": patch
---

`@omnisuite/calendar-core` now owns the editing wording and guards every renderer shares:
`PreviewDescription`, `previewDescriptionOf` and `describePreviewInEnglish` describe a preview;
`cancelMessageOf`, `unchangedMessageOf` and `untargetedMessageOf` say how a gesture went;
`editFingerprintOf` tells a changed event from a re-render; `evaluationKeyOf` tells a new result
from the same one; `editCapabilityOf` and `resizableEdgesOf` say what a gesture may change. The steps of a gesture
are shared too: `gestureStartOf` says whether a gesture may begin and gives its `gestureStarted`
event, `canStepGesture` whether a keyboard step may move it, `gestureRowOf` which resource row a
keyboard move goes to, `evaluateGesture` what releasing it now would do, and
`unreportedRuleErrorOf` with the gesture store's new `ruleReported` event (and
`EditGesture.reportedRules`) report each rule that threw once per gesture.
`@omnisuite/calendar-react` uses them, with unchanged behaviour and text, and still exports
`PreviewDescription`.
