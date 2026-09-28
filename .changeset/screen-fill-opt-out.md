---
"@momoi-labs/kiso": minor
---

`.form-page` fills the viewport from 1024px the way `.detail-tabs` does: the
card takes the height the header leaves and the form scrolls inside it under
sticky FormActions. Both cards accept `data-fill="false"` to let the document
scroll instead, the opt-out a list's `.table-wrap` already had.
