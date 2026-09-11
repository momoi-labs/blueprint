# Kiso React

React components that use Kiso's tokens and CSS, adapted from shadcn/ui with
Radix handling interactive behavior. Requires React 19 and React DOM 19.

```sh
npm install @momoi-labs/kiso-react
```

Import the stylesheet once, before application overrides:

```tsx
import '@momoi-labs/kiso-react/styles.css';
import { Button, FormField, Textarea } from '@momoi-labs/kiso-react';

export function ApplicationForm() {
  return (
    <form>
      <FormField name="name" label="Name" hint="Choose a unique name." required />
      <Button type="submit" variant="primary">Save</Button>
    </form>
  );
}
```

FormField renders an Input by default. Pass one control as its child when the
field uses another input, and add `error` for wired validation feedback:

```tsx
<FormField label="Compose file" hint="Docker Compose YAML." error={error}>
  <Textarea rows={12} />
</FormField>
```

`@momoi-labs/kiso` is a regular dependency. The stylesheet imports Google Fonts
first, then Kiso tokens and the component layer; consumers do not need to import
those again. React and React DOM are peer dependencies supplied by the
application. No Tailwind setup is required. The stylesheet includes global
styles and Google Fonts.

## Available components

Controls and forms

- Button and `buttonVariants`; Badge and `badgeVariants`.
- Input, Textarea, Search, Label, Checkbox, Switch, and FormField.
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup,
  SelectLabel, and SelectSeparator.
- ChipInput, ChipInputBox, ChipInputField, ChipInputList, ChipInputOption,
  ChipInputEmpty, and the chip parts Chip, ChipScope, ChipName, ChipValue,
  ChipOption, ChipOptionAdd, ChipRemove, for several structured values in one
  field. Each chip reads as a call: scope, name, value, then one segment per
  option as name=value or name=[a, b].
- ValidationMessage, for a field error referenced by `aria-describedby`.

Data and structure

- Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter.
- Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption.
- EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions.
- Header, PageHeader, PageHeaderTitle, PageHeaderDescription.
- Sidebar, SidebarHeader, SidebarBody, SidebarFooter.
- AppShell and AppShellMain, the low-level columns of a console.
- ApplicationShell, the standard brand, navigation, header, footer, and page
  arrangement. Pass `layout="topbar"` for a single-surface frame with brand and
  primary action in the top bar and no sidebar rail.
- Split, Pane, and Splitter, a list-detail layout with a resizable divider.
- LogView, LogViewLine, LogViewTime, and LogViewLevel.
- Stat, StatHeader, StatLabel, StatValue, StatFoot, and StatDelta.
- KV, KVKey, and KVValue, a description list of fixed facts.
- Separator, horizontal or vertical, and Dot and `dotVariants`.
- BrandMark and TerminalIcon, the momoi-labs terminal prompt glyph.

Navigation

- Navigation, NavigationGroup, NavigationList, NavigationItem, NavigationLink.
- Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage,
  BreadcrumbSeparator.
- Link and `linkVariants`; Pagination, PaginationPrevious, PaginationNext,
  PaginationPage, PaginationEllipsis.
- Tabs, TabsList, TabsTrigger, TabsContent.
- ThemeSelector, a controlled selector. The application owns theme persistence
  and applies `data-theme="light"` or `data-theme="dark"` to the document root.
  Remove the attribute for system mode.

Feedback

- Alert, AlertContent, AlertTitle, AlertDescription, and `alertVariants`.
- Spinner, Skeleton, and their variants.
- Toasts and `useToast`, for notifications raised from descendant event
  handlers.
- ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription,
  ToastContent, ToastAction, ToastClose, for controlled composition.

Overlays

- Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter,
  DialogTitle, DialogDescription, DialogClose.
- AlertDialog, Trigger, Portal, Overlay, Content, Header, Footer, Title,
  Description, Action, and Cancel (each prefixed with `AlertDialog`).
- Drawer, with `placement="bottom"` or `"side"`, and the matching `Drawer*` parts.
- Popover, DropdownMenu, and Tooltip, with their trigger and content parts.
- CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteGroup,
  CommandPaletteItem, CommandPaletteEmpty.

Button variants are `default`, `primary`, `destructive`, and `ghost`; sizes are
`xs`, `sm`, `md`, and `lg`. Badge variants are `neutral`, `info`, `success`,
`warning`, and `danger`. Alert and Toast variants follow their contracts:
`info` / `success` / `warning` / `error`, and `neutral` / `success` / `warning`
/ `error`. Native props and refs pass through to the underlying control.
FormField adds `label`, optional `hint`, and optional `error` to Input's props.
With one child, it wires those parts to that control instead of rendering an
Input. Use `fieldClassName` to style the wrapper.

Wrap an application in Toasts and call `useToast()` below it. The returned
function takes a variant, title, and optional body:

```tsx
const notify = useToast();
notify('error', `Could not stop ${app.name}`, details);
```

ApplicationShell takes navigation groups as data in the default sidebar layout.
Destinations keep routing in the product through `{ href, active, onClick? }`;
the package owns the repeated Sidebar, Navigation, Header, and main
arrangement. With `layout="topbar"`, omit navigation and footer: brand and
primary action move into Header beside the existing header slot.

Navigation, Sidebar, and Link know nothing about routing. Mark the current
destination with `active`, and pass `asChild` to render a router's own link
component. CommandPalette is controlled: it owns the overlay, focus, and its
Arrow / Enter / Escape keys, while the product owns the shortcut that opens it
and the filtering that decides which items to render.

Dot variants match Badge's: `neutral`, `info`, `success`, `warning`, and
`danger`, plus `size` and `pulse`. A `neutral` Dot inherits `currentColor`, so
it takes the colour of the row it sits in. StatDelta takes the same variants.

Splitter owns the pane size, so dropping one between two Panes is the whole
setup. It writes a percentage to the pane before it, starts at `defaultSize`
and stays between `min` and `max`, and reports changes through `onSizeChange`.
It is a real `separator`: focus it and the arrow keys move it by `step`, Home
and End take it to the bounds.

LogView owns its scroller and follows the tail. New lines pin the view to the
end until the reader scrolls away, and returning to the end resumes. Drive that
from a control of your own with `follow` and `onFollowChange`, or scroll to the
end imperatively through the ref:

```tsx
const log = useRef<LogViewHandle>(null);

<LogView ref={log} follow={follow} onFollowChange={setFollow}>
  <LogViewLine>
    <LogViewTime>09:41:03.901</LogViewTime>
    <LogViewLevel level="warn">WARN </LogViewLevel> redis unavailable
  </LogViewLine>
</LogView>
<Button onClick={() => log.current?.scrollToBottom()}>Jump to end</Button>
```

Compose confirmations with AlertDialogTitle and AlertDialogDescription inside
AlertDialogContent, plus AlertDialogCancel and AlertDialogAction. For asynchronous
actions, control `open` and prevent the Action's default click behavior until the
operation succeeds. Application code owns pending, error, and retry states.

BrandMark takes a letter or a single SVG icon as `children`. It hides itself
from assistive technology; keep the product name beside it. SVG children get
the existing `icon icon-sm` classes. Custom icons must forward `className`.

```tsx
import { BrandMark, TerminalIcon } from '@momoi-labs/kiso-react';

<div className="brand">
  <BrandMark>S</BrandMark>
  <span>self-host</span>
</div>
<div className="brand">
  <BrandMark><TerminalIcon /></BrandMark>
  <span>self-host</span>
</div>
```

## Development

From the repository root, run `npm ci`, then `npm run prototype`. The component
gallery opens at <http://127.0.0.1:5173/#components> and covers all 44 Kiso
catalog entries, each rendering the component this package exports. Its sample
data is simulated in memory.

`npm run check:react` builds the demo and tests packed npm artifacts in an
isolated consumer, including TypeScript, CSS bundling, and rendered semantics.

See [Publishing Kiso](../../docs/publishing.md) for releases. Adapted shadcn/ui
code retains its upstream MIT notice in `SHADCN-LICENSE`.
