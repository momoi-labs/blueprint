# Kiso component catalog

Kiso defines product UI as markdown contracts rather than implementation code.
Each contract specifies anatomy, states, accessibility, usage guidance, semantic
token consumption, and a Radix/shadcn behavioral reference where one exists.

## Nucleus

- [Alert](alert.md) — Communicates persistent in-page information, success, warnings, or errors.
- [Badge](badge.md) — Labels status or compact metadata without becoming an action.
- [Button](button.md) — Triggers a visible, text-labeled action without changing the URL.
- [Card](card.md) — Groups related content and actions with visual separation.
- [Checkbox](checkbox.md) — Toggles an option in a list or selects multiple values.
- [FormField](form-field.md) — Composes Label, a form control, HelperText, and ValidationMessage with consistent ID and ARIA wiring.
- [HelperText](helper-text.md) — Provides persistent, non-error context for a form control.
- [IconButton](icon-button.md) — Triggers a compact icon-only action with a required accessible name.
- [Input](input.md) — Collects a single-line text-like value.
- [Label](label.md) — Gives a form control its visible, programmatically associated name.
- [Link](link.md) — Navigates to a URL while preserving native link behavior.
- [Select](select.md) — Chooses one value from a predefined set of options.
- [Skeleton](skeleton.md) — Preserves known layout while its content is loading.
- [Spinner](spinner.md) — Signals indeterminate work when the final layout is not represented.
- [Switch](switch.md) — Changes one immediately applied boolean setting.
- [Textarea](textarea.md) — Collects multi-line free-form text.
- [Tooltip](tooltip.md) — Adds nonessential pointer or keyboard context as progressive enhancement.
- [ValidationMessage](validation-message.md) — Explains a field-level validation error and how to fix it.

## Data

- [CommandPalette](command-palette.md) — Searches and runs global actions or navigation from a keyboard-first overlay.
- [DropdownMenu](dropdown-menu.md) — Presents contextual actions anchored to a specific object or trigger.
- [EmptyState](empty-state.md) — Replaces an empty collection with an explanation and optional next action.
- [Search](search.md) — Filters visible content such as a list or table.
- [Table / DataTable](table.md) — Presents structured records with optional sorting, selection, filtering, and pagination.

## Navigation and structure

- [Breadcrumb](breadcrumb.md) — Shows the current location within a hierarchy.
- [Header](header.md) — Composes persistent application navigation and global actions.
- [Navigation](navigation.md) — Provides a generic semantic container for destination links.
- [PageHeader](page-header.md) — Composes a page title, optional subtitle, and page-scoped action Buttons.
- [Pagination](pagination.md) — Moves through known pages while exposing the current position.
- [Sidebar](sidebar.md) — Organizes persistent navigation into optionally collapsible sections.
- [Tabs](tabs.md) — Switches among related content panels within the same page context.

## Overlay

- [Drawer](drawer.md) — Presents a viewport-adaptive panel, including a mobile alternative to Modal/Dialog.
- [Modal / Dialog](modal-dialog.md) — Blocks the page for a focused task that requires attention or a decision.
- [Popover](popover.md) — Shows rich, interactive contextual content anchored to a trigger.
- [Toast](toast.md) — Reports transient system feedback without replacing in-page status or field errors.

## Required compositions

- [FormField](form-field.md) composes [Label](label.md) + [Input](input.md) (or another form control) + [HelperText](helper-text.md) + [ValidationMessage](validation-message.md).
- [Header](header.md) composes [Link](link.md) + [IconButton](icon-button.md) + optional [DropdownMenu](dropdown-menu.md).
- [Table / DataTable](table.md) composes [EmptyState](empty-state.md), [Skeleton](skeleton.md), and [Pagination](pagination.md) for empty, loading, and paged states.
- [PageHeader](page-header.md) composes a title + optional subtitle + [Buttons](button.md).
