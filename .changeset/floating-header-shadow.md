---
"@momoi-labs/kiso": minor
"@momoi-labs/kiso-react": minor
---

A floating Header now follows `data-shadow-style` like a panel. Hard and Soft cast the panel shadow with Square, Rounded, Asymmetric, Pixel, Manga and Brush geometry, and None removes it. Before, Pixel corners clipped the shadow away and the other contours kept a fixed contact shadow. With Manga and Brush borders a floating Header now draws its whole ink contour.

The React `Header` renders the `.panel-shadow` paint layer as its first child. A native floating header needs the same child for a shaped shadow; see `kiso/docs/tokens.md`. If your CSS targets the first child of a Header, select past `.panel-shadow`.

`GridPane` renders the same paint layer, so a pane in a `PaneGrid` casts Hard and Soft shadows under Pixel, Manga and Brush. Before, those panes had no shadow with shaped corners.

Under Pixel corners, the hover fill of a navigation item steps its corners like the panel around it.
