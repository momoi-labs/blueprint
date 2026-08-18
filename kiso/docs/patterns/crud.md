# CRUD

Create, read/update, and delete flows for a single entity type. Covers form
layout, validation, and the create / edit / delete states without inventing
one-off form kits.

User stories #9 and #10.

## Purpose

Make every Momoi resource editable the same way: labeled fields, predictable
primary/secondary actions, field-level validation, and clear success or failure
feedback. This layout pattern places create/edit surfaces and delete entry
points; confirmation copy and acknowledgment for irreversible deletes are
specified separately and must still run before destruction.

## Component composition

| Concern | Compose with | Role |
| --- | --- | --- |
| Page framing | [PageHeader](../components/page-header.md) | Title ("New connection", "Edit connection"); optional cancel secondary action |
| Fields | [FormField](../components/form-field.md) | Each field = [Label](../components/label.md) + control ([Input](../components/input.md), [Textarea](../components/textarea.md), [Select](../components/select.md), [Checkbox](../components/checkbox.md), …) + optional [HelperText](../components/helper-text.md) + [ValidationMessage](../components/validation-message.md) |
| Grouping | [Card](../components/card.md) or section headings | Related field groups (connection, credentials, advanced) |
| Primary actions | [Button](../components/button.md) | Save / Create (primary); Cancel (secondary/ghost) |
| Overlays | [Modal / Dialog](../components/modal-dialog.md) or [Drawer](../components/drawer.md) | Compact create/edit; Drawer preferred on small viewports for the same task |
| Inline errors | [ValidationMessage](../components/validation-message.md) on FormField | Field-level recovery; page [Alert](../components/alert.md) is for non-field failures |
| Form / load errors | [Alert](../components/alert.md) | Submit or load failures that are not field-local (what / why / now) |
| Success | [Toast](../components/toast.md) | Brief "Saved" / "Created"; do not rely on Toast alone for blocking failures |
| Delete entry | Button or [DropdownMenu](../components/dropdown-menu.md) item | Opens confirmation flow; danger styling on the destructive control |
| Read context | [Badge](../components/badge.md), [Tabs](../components/tabs.md) | Status and sections on edit/detail surfaces |
| Shell | [Application shell](application-shell.md) | Authenticated framing |

Tokens: form surfaces `--color-surface`, canvas `--color-background`, borders
`--color-border`, text `--color-foreground` / `--color-muted-foreground`,
invalid fields and ValidationMessage use `--color-danger`, focus
`--color-focus`, destructive Buttons use `--color-danger` per the Button
contract.

## Flow

### Create

1. Person activates Create from PageHeader or EmptyState.
2. Open full-page form, Modal, or Drawer with empty FormFields.
3. Person submits; invalid fields show ValidationMessage and receive focus on
   the first error.
4. On success: Toast (optional), navigate to the new entity's detail or list
   selection; close overlay if used.
5. On failure: keep the form open; Alert for non-field errors; preserve input.

### Edit

1. Person opens Edit from list-detail actions or a detail PageHeader.
2. Form loads current values; read-only identifiers stay visible but not
   editable when the API forbids changes.
3. Save enables when the form is dirty (product may also allow explicit Save
   always — be consistent within a product).
4. Validation and error handling match Create.
5. Cancel discards unsaved changes (confirm only if dirty and loss is material).

### Delete

1. Person chooses Delete from entity actions.
2. An explicit confirmation step runs before destruction (Modal/Dialog with
   clear consequences); this layout requires that step, not its microcopy.
3. On success: Toast or list refresh; navigate away from a deleted detail.
4. On failure: Alert with recovery; entity remains.

Prefer Modal/Drawer for short create/edit. Use a full main-page form when the
field set is long, multi-section, or needs side-by-side reference content.

## States

| State | Behavior |
| --- | --- |
| loading (edit) | Skeleton for known field layout inside the form surface; do not flash empty Inputs. |
| empty (create from empty collection) | EmptyState on the list offers Create; CRUD form is the next step — do not reinvent empty handling inside the form. |
| invalid | ValidationMessage per field; first invalid control focused; do not clear other fields. |
| submitting | Primary Button loading (Spinner in Button); prevent double submit; Cancel remains available when safe. |
| error (load) | Alert in the form region (what / why / now); offer retry; Cancel/back remains. |
| error (submit) | Field errors via ValidationMessage; server/business errors via Alert; form stays open with values preserved. |
| success | Toast or inline success only as confirmation; navigate or refresh per flow above. |

## Layout sketch

Full-page create/edit:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PageHeader: Edit connection                         [Cancel] [Save]  │
├──────────────────────────────────────────────────────────────────────┤
│ Alert (only if submit/load error — what / why / now)                 │
│                                                                      │
│ Card: Connection                                                     │
│   FormField  Name                                                    │
│   FormField  Host                                                    │
│   FormField  Port                                                    │
│                                                                      │
│ Card: Credentials                                                    │
│   FormField  User                                                    │
│   FormField  Password                                                │
│   FormField  SSL          [Select]                                   │
│                                                                      │
│                                              [Cancel]  [Save]        │
└──────────────────────────────────────────────────────────────────────┘
```

Modal create (compact):

```text
          ┌─────────────────────────────────┐
          │ New connection            [✕]   │
          │                                 │
          │ FormField Name                  │
          │ FormField Host                  │
          │ FormField Port                  │
          │                                 │
          │          [Cancel]  [Create]     │
          └─────────────────────────────────┘
```

## When to use

- Any resource with create and/or edit forms.
- Delete entry points on list rows or detail headers.

## When NOT to use

- Immediate boolean preferences without a Save affordance — prefer Switch
  inside [Settings](settings.md).
- Bulk multi-entity editors — extend list-detail selection + confirmed bulk
  actions instead of a single CRUD form.

## Related patterns

- [List-detail](list-detail.md) — where Create and row actions usually live.
  List EmptyState still follows the canonical rule: do not reinvent search,
  filters, pagination, or empty state on the way into Create.
- [Settings](settings.md) — preference forms with explicit save sections.
