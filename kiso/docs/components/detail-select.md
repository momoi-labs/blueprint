# DetailSelect

## Purpose

Choose one value after comparing illustrations and explanations. The closed
control shows the selected option's icon and title. Opening it reveals a list
with an illustration on the left and a title with rich content on the right.
Use [Select](select.md) when short labels give enough information.

## Anatomy and layout

The component includes a visible label, a Select-shaped trigger, and a
portalled [Popover](popover.md). Each option has a selection button, an
illustration, and a description. Descriptions accept paragraphs, links,
diagrams, and other React content.

The open panel overlays the page. It never pushes surrounding content down.
Its width stays within the viewport, its height is limited to the available
space and 32rem, and long lists scroll inside the panel. At narrow widths the
illustration column becomes smaller while the explanation keeps wrapping.
Wide content in an explanation scrolls horizontally within that column.
Option panes fill the panel's content area without outer padding or gaps.

## React API

| Prop | Behavior |
| --- | --- |
| `label` | Required visible label and part of the trigger's accessible name. |
| `options` | Array of options with unique `value`, `label`, `illustration`, and `description`. Each option may include `icon` and `disabled`. |
| `value`, `onValueChange` | Controlled selection and its change callback. |
| `defaultValue` | Initial selection when `value` is omitted. |
| `placeholder` | Closed text without a matching selection. Defaults to "Choose an option". |
| `disabled` | Prevents opening the control. |
| `controlSize` | `sm`, `md`, `lg`, or `xl`, matching Select trigger sizes. |
| `id`, `className` | Trigger ID and outer layout class. |
| `aria-describedby`, `aria-invalid` | Connect helper or validation text to the trigger. |

Clicking an enabled option's title or noninteractive content selects it and
closes the panel. Links and other controls inside descriptions keep their own
behavior and do not select the option. Tab navigation does not change the value.
Selecting the current value closes the panel without another change callback.

An empty list shows "No available options." Disabled options remain readable
but cannot be chosen. A value without a matching option shows the placeholder.
Products own loading and validation messages.

## Accessibility

The trigger is a native button. Radix Popover supplies expanded state, dialog
semantics, collision positioning, dismissal, and focus restoration. The panel
contains buttons and rich content instead of listbox options, so nested links
remain accessible.

- Enter, Space, Arrow Up, or Arrow Down opens the closed control and focuses
  the selected enabled option, or the first enabled option.
- Arrow Up and Down move between enabled selection buttons and select immediately.
  Home and End select the first and last enabled options. The panel stays open.
- Tab reaches selection buttons and links in their document order.
- Enter or Space on a selection button selects that option and closes the panel.
- Escape dismisses the panel and restores focus to the trigger, keeping the
  current selection.

The trigger icon is decorative. Give meaningful illustrations their own
accessible description; hide decorative illustrations from assistive technology.
Keep essential explanation text in the description rather than inside an image.

## Tokens and appearance

The trigger uses Select's control tokens. The panel uses `--color-popover`,
`--color-border`, `--shadow-md`, and `--radius-lg`. Rows use `--spacing-md`
padding and `--spacing-lg` between columns. A thin separator divides adjacent
options. Only the outer panel follows the control corner and frame choices.
Selected options and keyboard focus fill the whole pane with `--color-selected`
and `--color-selected-foreground`, without an individual frame. The selected
option keeps its fill and checkmark when the panel opens. Forced colors use a
visible focus outline. Hover fills enabled, unselected options with
`--color-accent-surface-hover` without changing the value. Links and other
controls keep their own focus indicators. Text uses
`--color-foreground` and `--color-muted-foreground`.

Set appearance attributes on `html` so portalled content inherits them.
The component follows the existing control corner and frame choices.
