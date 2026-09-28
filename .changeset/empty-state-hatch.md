---
"@momoi-labs/kiso-react": patch
---

EmptyState renders with the hatch, as the `.empty.hatch` block in `ui.css`
always intended. The React component never applied the class, so empty
regions looked like plain cards.
