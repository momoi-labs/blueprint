# Component scenario matrix

Read this matrix when preparing a validation case list. Select categories from
the component's contract and actual use. For each applicable category, record
inputs, expected outcomes, and evidence. Explain exclusions and unavailable
checks. The catalog and contracts define the APIs; this matrix defines probes.

## Common checks

| Category | Cases and observable outcomes |
| --- | --- |
| Package API | Public exports, types, refs, required props, distributed CSS and assets. Use the package entry point; test a tarball when packaging is in scope. |
| States | Documented variants, empty/loading/error states, disabled controls, and transitions between them. Confirm state and accessible attributes agree. |
| Layout | Light/dark themes, 320px and 390px widths, a desktop width, long unbroken text, many items, missing content, and text zoom. Check clipping, overlap, document overflow, and reachable actions. |
| Semantics | Names, roles, IDs, label associations, descriptions, invalid state, current/selected state, and decorative content. Multiple instances must not share IDs accidentally. |
| Focus | Tab and Shift+Tab order, visible focus, rerenders, removal of focused elements, and restoration after edit or dismissal. Inspect the actual focused element. |
| Pointer | Fine and coarse pointers. Measure effective targets using hit tests, including pseudo-elements, and verify edge taps/dragging. Check both target dimensions against the current accessibility contract. |
| Color | Rendered foreground/background pairs in normal, hover, selected, focus, error, and disabled states where required. Include nested secondary text; token checks alone do not cover every composition. |
| Lifecycle | Mount/unmount, repeated interaction, controlled updates, stable keys, event cleanup, and callback count. Repeat actions to catch duplicate listeners and stale state. |

Use browser zoom or a documented equivalent for zoom testing and identify the
method. A smaller viewport alone does not establish 200% text-zoom behavior.
Use deterministic waits for observable state rather than arbitrary sleeps.
Record layout magnification and text-only zoom separately. Include browser
versions, pointer emulation, font availability, and consumer styling in evidence.

## Text entry, chips, and filters

- Test Enter, Tab, Shift+Tab, Escape, arrows, Backspace, and Delete as applicable.
  Include an enclosing form and assert submission counts, not just key handling.
  Exercise empty input and no highlighted option as well as a populated list.
- Check IME composition with all relevant shortcuts. Pair synthetic events with
  ordinary input controls and identify native IME checks still needed.
- Exercise caret positions, selection replacement, paste, partial syntax,
  malformed tokens, unknown fields, and text before and after a completion.
  Define a data-preservation invariant: accepting a suggestion may replace its
  intended range but must preserve unrelated input.
- For editable segments, cover confirmation, cancellation, blur, removal, and
  replacement by the controlled parent. Assert saved values and resulting focus.
- Test empty suggestions, disabled entries, list changes while highlighted,
  repeated selection, and repeated announcements. Check active descendant IDs
  refer to existing enabled options. DOM changes are only announcement evidence;
  record separately whether an actual screen reader was used.

## Lists, selectors, menus, and overlays

- Use zero, one, and enough entries to exceed the viewport. Check both first
  and last entries are reachable with touch and keyboard. Inspect content bounds,
  scrollHeight/clientHeight, and body scroll locks.
- Change or remove the active entry, disable options, and confirm selection only
  occurs on the documented trigger. Distinguish focus/highlight from selection.
- For mutually exclusive controls, check the contracted arrow-key behavior and
  number of tab stops. Pointer selection alone does not validate their keymap.
- Cover opening, dismissal, Escape, outside interaction, focus containment where
  required, and focus restoration. Include nested overlays if consumers use them.
- For confirmation dialogs, verify cancel and rejected/prevented actions preserve
  state. Assert destructive callbacks never run from cancellation.
- Test pagination and tabs with disabled controls, many items, narrow widths,
  meaningful names, and controlled state that survives panel changes as promised.

## Data display and metrics

- Exercise no samples, one sample, constant values, negative values where valid,
  null gaps, non-finite input, and range boundaries. Distinguish missing from zero.
- Compare summaries with an independent expected calculation. Check gap handling,
  series association, timestamps, clamping, and rejection of unsupported inputs.
- Verify accessible labels and exact-value alternatives as well as plotted output.
  Assert validity of generated coordinates; a successful render alone is not enough.
- Test long row and series labels in addition to large datasets. Check that the
  panel wraps labels or owns its scroll range without widening the document.
- Use realistic upper bounds from consumers for volume and update rate. Record
  responsiveness or memory evidence when performance is in scope; avoid invented
  extreme limits that the component does not promise to support.

## Resizing, scrolling, and asynchronous feedback

- For split panes, test pointer dragging, coarse-pointer hit area, keyboard steps,
  Home/End when supported, bounds, and controlled updates. Check adjacent controls.
- For logs, cover initial follow, append, user scroll into history, resume, cleared
  data, and controlled follow. Retain the user's reading position while paused.
- For toasts, cover bursts, timeout, pause/resume on hover and focus, dismissal,
  repeated identical messages, and provider unmount. Observe event counts.
- For progress and steps, exercise transitions, partial progress, failure, skips,
  missing data, and announced text. Check clamping against the documented range.

## Forms and shared layouts

- Change error/hint/required/disabled state and verify stable IDs, merged
  descriptions, retained text, and reachable submission actions.
- Cover short and long form content, sticky actions, validation messages,
  list-to-detail composition, tabs, and narrow navigation. Test the surrounding
  shell when it determines available height or scroll ownership.
- For presentational parts, verify semantics, documented variants, and content
  boundaries. Record keyboard and callback categories as not applicable when
  the part has no interactive behavior.

## Gallery and Appearance integration

Apply these checks to existing and new gallery components. Classify each
control by its role, not by component name or control type. Record this
classification in the case ledger before testing.

| Control role | Location | Examples |
| --- | --- | --- |
| Configures the demonstration or simulates a state | Component options in Appearance | Size, variant, orientation, disabled/loading toggles, PaneGrid wrap/fill/pack |
| Inspects implementation details | Component demonstration, outside Appearance | Debug overlays, row/column diagnostics, size bounds |
| Performs the interaction being demonstrated | Inside the example | Select an item, enter text, submit a form, dismiss an alert, move or resize a pane |
| Changes the gallery's shared presentation | Global Appearance controls | Theme, accent, borders, typography |

A Switch that simulates a disabled state belongs in Appearance. A Switch that
is itself the component under inspection stays in the example. ThemeSelector
and AccentSelector demonstrations also stay in the example, even though global
Appearance uses those same components. Classify by purpose in that composition.

For every new or changed demo, record whether it needs component options in
Appearance and why. A demo with no configuration controls needs no options
section or link. Keep component options scoped to their intended demo; putting
them in Appearance does not make them global preferences. This classification
is a gallery convention, not a change to the published component API.

- Open the browse gallery and the component's direct detail URL. Verify both
  render the shared component. For layout components, inspect the actual layout
  owner, not only the demo nested inside a card. PaneGrid must own the gallery
  cards and the groups in `#example/settings`.
- For demos with configuration controls, confirm those controls live in
  Appearance. The card and detail view expose a link that opens their options;
  they must not render the controls inline or open Appearance on mount. Keep
  the component's own interactions in the example. Preserve the standalone
  prototype's inline fallback when no provider exists. PaneGrid's illustrated
  layout options belong in Appearance; its debug switch stays with the demo.
- Open the link with Appearance closed and already open. Test the desktop panel
  and narrow-screen drawer. Verify the options are visible and reachable, change
  an option, and assert its effect on the intended demo. Close and reopen the
  panel to verify retained state and keyboard focus behavior.
- Navigate between browse, detail, and a layout example. Check for duplicate or
  stale option sections, controls affecting another demo, and lost state during
  portal or drawer remounts. Exercise search and category filters as well.
- In each real PaneGrid consumer, move and resize panes. Assert order, size,
  saved layout, and restoration after reload. Filtering must not discard hidden
  panes. Check compact widths stack or scale panes without rewriting saved sizes.
  Interacting with links, fields, or actions inside a pane must not move it.
- Test with navigation and Appearance open together. Check content overflow,
  clipped labels, scroll ownership, and reachable controls at the available
  content width. Capture browse, detail, and layout evidence separately.
