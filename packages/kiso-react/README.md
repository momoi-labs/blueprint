# Kiso React

React components that use Kiso's tokens and CSS, adapted from shadcn/ui with
Radix handling interactive behavior. Requires React 19 and React DOM 19.

```sh
npm install @momoi-labs/kiso-react
```

Import the stylesheet once, before application overrides:

```tsx
import '@momoi-labs/kiso-react/styles.css';
import { Button, FormField } from '@momoi-labs/kiso-react';

export function ApplicationForm() {
  return (
    <form>
      <FormField name="name" label="Name" hint="Choose a unique name." required />
      <Button type="submit" variant="primary">Save</Button>
    </form>
  );
}
```

`@momoi-labs/kiso` is a regular dependency. The stylesheet imports its tokens
and component layer; consumers do not need to import those again. React and
React DOM are peer dependencies supplied by the application. No Tailwind setup
is required. The Kiso base stylesheet includes global styles and Google Fonts.

## Available components

Controls and forms

- Button and `buttonVariants`; Badge and `badgeVariants`.
- Input, Textarea, Search, Label, Checkbox, Switch, and FormField.
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup,
  SelectLabel, and SelectSeparator.
- ValidationMessage, for a field error referenced by `aria-describedby`.

Data and structure

- Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter.
- Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption.
- EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions.
- Header, PageHeader, PageHeaderTitle, PageHeaderDescription.
- Sidebar, SidebarHeader, SidebarBody, SidebarFooter.
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
- ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription,
  ToastContent, ToastAction, ToastClose.

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
FormField adds `label` and optional `hint` to Input's props.

Navigation, Sidebar, and Link know nothing about routing. Mark the current
destination with `active`, and pass `asChild` to render a router's own link
component. CommandPalette is controlled: it owns the overlay, focus, and its
Arrow / Enter / Escape keys, while the product owns the shortcut that opens it
and the filtering that decides which items to render.

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
gallery opens at <http://127.0.0.1:5173/#components> and covers all 36 Kiso
catalog entries, each rendering the component this package exports. Its sample
data is simulated in memory.

`npm run check:react` builds the demo and tests packed npm artifacts in an
isolated consumer, including TypeScript, CSS bundling, and rendered semantics.

See [Publishing Kiso](../../docs/publishing.md) for releases. Adapted shadcn/ui
code retains its upstream MIT notice in `SHADCN-LICENSE`.
