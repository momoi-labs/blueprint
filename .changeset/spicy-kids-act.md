---
"@momoi-labs/kiso-react": patch
---

Keep Shift+Tab navigation from accepting ChipInput suggestions.

Ignore ChipInput and CommandPalette shortcuts during IME composition, including
legacy composition key events and Escape dismissal.

Restore focus after chip edits, option additions, and removals, including when a
controlled parent replaces the edited segment.
