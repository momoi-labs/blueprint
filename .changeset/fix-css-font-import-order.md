---
"@momoi-labs/kiso": patch
"@momoi-labs/kiso-react": patch
---

Stop Google Fonts from breaking CSS compilation when styles are flattened.

`ui.css` no longer `@import`s fonts. Nested after `tokens.css`, that import
landed mid-sheet in Next.js and failed the `@import` must precede all rules
rule. `@momoi-labs/kiso-react/styles.css` now leads with the fonts `@import`.
Consumers of `ui.css` alone load Inter and JetBrains Mono themselves.
