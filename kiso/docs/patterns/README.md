# Kiso pattern catalog

Kiso patterns are reusable screen-level compositions of the component catalog.
They define placement, flow, and states without redefining components. A list
screen must not reinvent search, filters, pagination, and empty state; compose
the patterns below instead.

## Layout

- [Application shell](application-shell.md) — Frames every product with persistent header, sidebar, and main content regions.
- [List-detail](list-detail.md) — Keeps a collection and the selected record in one navigable context.
- [CRUD](crud.md) — Coordinates consistent create, read, update, and delete flows and states.
- [Dashboard](dashboard.md) — Arranges dense, independently loading widgets with clear hierarchy and drill-down.
- [Settings](settings.md) — Structures configuration forms, save behavior, validation, and feedback.
- [Login and authentication](login-authentication.md) — Guides sign-in, recovery, SSO, failure, and successful entry.

## State

- [Empty states](empty-states.md) — Distinguishes first use, no matches, and informational emptiness with an appropriate next action.
- [Loading](loading.md) — Preserves known structure and context while work is in progress.
- [Errors](errors.md) — Explains what happened, why when known, and what the person can do now.
- [Permission denied](permission-denied.md) — Treats missing access as a distinct state with a path to request it.
- [Onboarding](onboarding.md) — Leads a new user through initial setup while preserving progress and recovery.

## Behavior

- [Search](search.md) — Narrows a visible collection with consistent query, shortcut, highlighting, and no-results behavior.
- [Filtering](filtering.md) — Narrows a collection by explicit facets with visible, removable filter state.
- [Sorting](sorting.md) — Orders a searched or filtered set with consistent controls and indicators.
- [Pagination](pagination.md) — Navigates known, bounded datasets while preserving list context.
- [Large data tables](large-data-tables.md) — Combines sticky headers, virtualization or pagination, responsive behavior, and canonical cell rendering.
- [Destructive actions](destructive-actions.md) — Gates irreversible actions behind a clear consequence and mandatory confirmation.
- [Confirmations](confirmations.md) — Defines consequence copy, focus, cancellation, and acknowledgment for consequential actions.
- [Command palette](command-palette.md) — Provides keyboard-first global navigation and action execution without bypassing safety gates.
- [Keyboard shortcuts](keyboard-shortcuts.md) — Makes shortcuts consistent, discoverable, conflict-safe, and accessible.
- [Developer-oriented interfaces](developer-oriented-interfaces.md) — Supports friendly and exact raw representations without losing technical fidelity.

## Data-heavy interfaces

- [Data interfaces](../data-interfaces.md) — Prescribes alignment, units, missing values, warnings, dangerous values, code, truncation, copying, comparisons, and responsive tables.
