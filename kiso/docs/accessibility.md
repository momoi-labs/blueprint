# Accessibility

Accessibility is a requirement at every Kiso layer, not a final review step.
An implementation is incomplete if it cannot be understood and operated with
a keyboard, screen reader, touch input, or reduced-motion preference.

## Tokens

- Use semantic color tokens documented in [`tokens.md`](tokens.md); do not
  substitute raw colors or infer contrast from appearance.
- Text and meaningful graphical controls must meet the applicable WCAG AA
  contrast requirement in every supported state, including hover, focus,
  disabled, selected, warning, and error states.
- Run `node scripts/check-contrast.mjs` after token changes. The contrast gate
  validates the committed foreground/background pairs, but it does not excuse
  checking new product compositions or non-text contrast.
- Do not communicate meaning with color alone. Pair status and errors with
  text, an icon with an accessible name, or another programmatic cue.
- Respect `prefers-reduced-motion`. Remove nonessential movement and replace
  essential transitions with an immediate or substantially reduced alternative.

## Components

- Start with native semantic HTML. Add ARIA only when native semantics cannot
  express the required behavior; ARIA does not repair incorrect interaction.
- Follow the **Accessibility** section in every
  [component contract](components/README.md). It is the source of truth for
  roles, accessible names, state attributes, focus behavior, and keystrokes.
- Every interactive element must be reachable and operable by keyboard, with a
  visible focus indicator. Keep focus order aligned with reading and visual
  order; do not use positive `tabindex` values.
- Interactive touch targets must be at least 44 by 44 CSS pixels. A visible
  control may be smaller only when its interactive hit area reaches that size
  without overlapping another target.
- Give icon-only controls an accessible name. Decorative icons must be hidden
  from assistive technology.

## Patterns and focus flows

- Follow the keyboard and focus flow in the relevant
  [pattern contract](patterns/README.md); do not invent a competing shortcut or
  navigation model locally.
- When opening a modal surface, move focus into it, contain focus while it is
  active, support `Escape` when dismissal is allowed, and restore focus to the
  trigger when it closes. Use the component contract for exact behavior.
- On route or major view changes, place focus at the start of the new content or
  announce the change as appropriate. Do not leave focus on an element that no
  longer exists.
- Keyboard shortcuts must not override browser or assistive-technology
  commands. Make nonstandard shortcuts discoverable and provide an equivalent
  visible action.

## Content, errors, and updates

- Preserve a logical heading hierarchy, landmarks, lists, tables, labels, and
  relationships in the HTML. Visual arrangement is not a semantic structure.
- Associate every form control with a visible label and its instructions.
  Identify required fields in text or programmatically, not by color alone.
- Error messages must state what happened and what to do next, following
  [`voice-and-tone.md`](voice-and-tone.md). Associate field errors with their
  controls, set the invalid state programmatically, and move or summarize focus
  so a failed submission is discoverable without scanning the page.
- Announce asynchronous status changes with the least disruptive suitable live
  region. Do not move focus merely to announce success, loading, or background
  updates.
- Data tables must retain native table relationships and accessible headers.
  Use the [Table contract](components/table.md), relevant
  [data-interface guidance](data-interfaces.md), and the
  [large-data-table pattern](patterns/large-data-tables.md).

## Verification before merge

1. Navigate the complete flow using only the keyboard, including cancellation,
   recovery, and destructive-action paths.
2. Check focus visibility, order, containment, and restoration.
3. Test names, roles, states, labels, errors, and dynamic updates with a screen
   reader.
4. Verify text and non-text contrast in every state and run the token contrast
   gate when tokens are involved.
5. Enable reduced motion and confirm no essential information depends on
   animation.
6. Check touch targets at narrow viewports and zoom the interface to 200%
   without losing content or operation.

When an existing contract conflicts with these rules, do not silently deviate.
Document the conflict and propose a Kiso change under the decision boundary in
[`../AGENTS.md`](../AGENTS.md).
