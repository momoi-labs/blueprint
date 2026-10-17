---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Add `ImagePreview`, `AudioPreview` and `DetailOption`. An option can now show
an image thumbnail or a sound that plays from a button, and `DetailOption`
lays out an illustrated option in a list the product owns, such as an
autocomplete. In DetailSelect, Ctrl+Enter or Cmd+Enter plays the focused
option's audio without choosing it; `isPlayPreviewKey` and
`toggleAudioPreview` give other lists the same key. Previews never play by
themselves, and one plays at a time.
