---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Alert has diagnostic slots for an incident. `AlertCode` shows a code with a copy button. `AlertHelp` says the fix and takes an optional action button that stays visible. `AlertEvidence` with `AlertLine` lists timed events with a label each, and marks the main line in bold with "◂". `AlertNote` gives the consequence. A new `labels` prop renames the Details button and Dismiss, for example "Show evidence". The `.alert-head` and `.alert-facts` classes lay out the label row and short facts.
