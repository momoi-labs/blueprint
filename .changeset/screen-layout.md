---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add Lifecycle and StatusBadge, and the list, detail and create screen classes:
`.list-filters`, `.lifecycle` with its `.cluster-status` and `.cluster-verbs`,
`.detail-tabs` with `.detail-logs` and `.detail-pane`, and `.form-page`.
From 1024px a detail card, and a list's `.table-wrap` that is the last child
of `.page`, fill the viewport; set `data-fill="false"` on the `.table-wrap` to
keep a list at its natural height.
Products that copied them from self-host (ADR-0024) can delete their copies;
rename `.detail-terminal` to `.detail-pane`. Evidence is in issue #112.
