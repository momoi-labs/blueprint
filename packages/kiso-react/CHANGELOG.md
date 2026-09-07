# @momoi-labs/kiso-react

## 0.4.0

### Minor Changes

- fc586b2: Add the React compositions that the self-host console had to own locally.
  FormField now accepts any control and wires its help and validation. Toasts and
  useToast manage notifications raised below the provider. ApplicationShell
  builds the shared frame from product-owned destinations and slots.

### Patch Changes

- Updated dependencies [fc586b2]
  - @momoi-labs/kiso@0.7.0

## 0.3.0

### Minor Changes

- 0074e57: Add the console layout patterns that existed only in `ui.css`: AppShell,
  Split / Pane / Splitter, LogView, Stat, KV, Dot and Separator.

  Splitter owns the pane size and is a real `separator`, so the divider can be
  moved with the arrow keys and not only dragged. LogView owns its scroller and
  follows the tail, so consumers do not each rebuild that. Dot spells status as a
  `variant` prop, the way Badge already does, rather than as utility classes.

- 8f2ebff: Export the components the gallery demonstrated but the package never shipped:
  Textarea, Search, Select, Switch, ValidationMessage, EmptyState, Header,
  PageHeader, Sidebar, Navigation, Breadcrumb, Link, Pagination, Tabs, Alert,
  Spinner, Skeleton, Toast, Drawer, Popover, DropdownMenu, Tooltip, and
  CommandPalette. Dialog comes with them, because Drawer is a Dialog moved to an
  edge and the task dialog had no export either.

  Navigation, Sidebar, and Link stay out of routing: the product marks the
  current destination with `active` and passes `asChild` for its own link
  component. CommandPalette is controlled and owns the overlay, focus, and its
  Arrow, Enter, and Escape keys; the product owns the shortcut that opens it and
  the filtering behind it.

### Patch Changes

- 04f6d81: Stop the dialog surface from showing two scrollbars on content that fits. The
  corner marks are drawn outside the surface, so `overflow-y: auto` on the same
  element had something to scroll to at every size. The surface is now a flex
  column and the content region scrolls.
- d716077: Mark the current navigation destination beside the item instead of on it.

  `--color-selected` and `--color-accent-surface-hover` are the same value, so a
  filled current item and a hovered sibling painted the same surface and the 2px
  rail was left carrying the whole distinction. The fill now belongs to hover
  alone, and the marker moves into the sidebar's gutter, where it finally has the
  shared edge a rail needs.

  `.nav-row` lays navigation out in a row and moves that marker to the bottom
  edge, so a horizontal nav stops wearing a sidebar's left rail.

  The React layer stopped forcing a column on every navigation list, so the row
  treatment is not overridden from the package that consumes it.

- 4b6b6bc: Give `--color-selected` a value of its own, one ramp step past
  `--color-accent-surface-hover` (`accent.300` light, `accent.800` dark).

  The two tokens held the same value in both themes, so anything that can be
  hovered and selected at once painted one surface for both. In the command
  palette that is a defect: arrow down to the third command with the pointer over
  the first and both look highlighted, while only the keyboard one will run.

  Selection now reads as more committed than a hover, which is what a consumer
  reaching for the token expects. `selected-foreground` still clears 4.5:1 on the
  new fill in both themes.

- Updated dependencies [266747b]
- Updated dependencies [d716077]
- Updated dependencies [4b6b6bc]
  - @momoi-labs/kiso@0.6.0

## 0.2.0

### Minor Changes

- 8670908: Add BrandMark for decorative letters and SVG icons beside product names, with
  the momoi-labs TerminalIcon glyph. Document the component contract and preserve
  the existing CSS output.

### Patch Changes

- Updated dependencies [8670908]
  - @momoi-labs/kiso@0.5.0

## 0.1.0

### Minor Changes

- 7cd3e6c: Add React components backed by Kiso styles and Radix behavior, with typed exports
  and a stylesheet that loads the Kiso dependency.
