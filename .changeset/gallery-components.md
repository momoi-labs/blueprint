---
"@momoi-labs/kiso-react": minor
---

Export the components the gallery demonstrated but the package never shipped:
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
