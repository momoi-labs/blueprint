---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

Add CodeEditor, a native textarea for short code with line numbers and a highlight the product provides.

- One field frame holds the gutter and the code, so every border style, corner style and frame scope draws a single contour. Inner parts have no fill of their own, so Pixel corners stay visible.
- `highlight` returns React nodes or HTML as `{ __html }`, as from Prism. Kiso ships no highlighter. Without one, or under forced colors, the textarea shows its own text.
- `lineNumbers` turns the gutter on or off. The gutter and the highlight follow the textarea on both scroll axes and use the same font metrics.
- Focus, invalid and disabled states reach the frame inside FormField.
