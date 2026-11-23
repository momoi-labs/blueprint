import { useId, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  DetailPage,
  FormField,
  FormPage,
  KV,
  KVKey,
  KVValue,
  Link,
  ListPage,
  Search,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  type PageWidth,
  type StatusTone,
} from "@momoi-labs/kiso-react";
import { money, shopHref, stockState, type Product } from "./shop-data";

export const consoleScreens = [
  ["list", "List"],
  ["empty", "Empty list"],
  ["edit", "Edit"],
  ["edit-dirty", "Edit with changes"],
  ["create", "Create"],
  ["detail", "Detail"],
] as const;
export type ConsoleScreen = (typeof consoleScreens)[number][0];
export const consoleLayouts: readonly PageWidth[] = ["left", "center", "right", "full"];
export const detailTabs = ["overview", "stock", "orders"] as const;
export type DetailTab = (typeof detailTabs)[number];
const formerTabs: Record<string, DetailTab> = { nodes: "stock", events: "orders" };
export const readTab = (value = ""): DetailTab => detailTabs.find(tab => tab === value) ?? formerTabs[value] ?? "overview";
export const defaultLayout = (screen: ConsoleScreen): PageWidth =>
  screen === "list" || screen === "empty" || screen === "detail" ? "full" : "left";
export const crudPath = (screen: ConsoleScreen, layout?: string, tab?: DetailTab) =>
  ["crud", screen, ...(layout || tab ? [layout ?? defaultLayout(screen)] : []), ...(tab ? [tab] : [])].join("/");

type Go = (screen: ConsoleScreen, tab?: DetailTab) => void;

const tone = (product: Product): StatusTone =>
  product.stock === 0 ? "danger" : product.stock <= product.reorder ? "neutral" : "success";

function ProductsScreen({ products, width, go, open }: { products: Product[]; width: PageWidth; go: Go; open: (sku: string) => void }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(needle));
  return <ListPage
    width={width}
    title="Products"
    action={{ label: "Create product", icon: <Plus className="icon" aria-hidden="true" />, onClick: () => go("create") }}
    state={products.length === 0 ? "empty" : "ready"}
    empty={{ title: "No products yet", text: "A product appears here once you create one." }}
    filters={<div className="list-filters"><Search aria-label="Search products" placeholder="Search by name or SKU" value={query} onChange={event => setQuery(event.target.value)} /></div>}
    count={`${rows.length} of ${products.length} products`}
  >
    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody>
      {rows.map(product => <TableRow key={product.sku}>
        <TableCell>
          <Link href={shopHref(crudPath("detail"))} onClick={event => { event.preventDefault(); open(product.sku); }}>{product.name}</Link>
        </TableCell>
        <TableCell className="mono">{product.sku}</TableCell>
        <TableCell className="mono">{money(product.price)}</TableCell>
        <TableCell className="mono">{product.stock}</TableCell>
        <TableCell><StatusBadge tone={tone(product)}>{stockState(product)}</StatusBadge></TableCell>
      </TableRow>)}
      {rows.length === 0 && <TableRow><TableCell colSpan={5} className="muted">No product matches this search.</TableCell></TableRow>}
    </TableBody>
  </ListPage>;
}

type Draft = { name: string; sku: string; category: string; price: string; stock: string };
type DraftErrors = Partial<Record<keyof Draft, string>>;
const draftOf = (product: Product): Draft =>
  ({ name: product.name, sku: product.sku, category: product.category, price: product.price.toFixed(2), stock: String(product.stock) });
const same = (first: Draft, second: Draft) => (Object.keys(first) as (keyof Draft)[]).every(key => first[key] === second[key]);

function check(draft: Draft, taken: string[]) {
  const errors: DraftErrors = {};
  if (!draft.name.trim()) errors.name = "Enter a product name.";
  if (!/^[A-Z]{3}-\d{4}$/.test(draft.sku.trim())) errors.sku = "Use three letters, a dash and four digits, like SHU-0406.";
  else if (taken.includes(draft.sku.trim())) errors.sku = "Another product uses this SKU.";
  if (!/^\d+(\.\d{1,2})?$/.test(draft.price.trim())) errors.price = "Enter a price like 24.00.";
  if (!/^\d+$/.test(draft.stock.trim())) errors.stock = "Enter a whole number, 0 or more.";
  return errors;
}

function useProductForm(start: Draft, taken: string[]) {
  const id = useId();
  const [draft, setDraft] = useState(start);
  const [errors, setErrors] = useState<DraftErrors>({});
  const field = (key: keyof Draft) => ({
    id: `${id}-${key}`,
    name: key,
    value: draft[key],
    error: errors[key],
    onChange: (event: { target: { value: string } }) => {
      setDraft(current => ({ ...current, [key]: event.target.value }));
      setErrors(current => ({ ...current, [key]: undefined }));
    },
  });
  const validate = () => {
    const next = check(draft, taken);
    setErrors(next);
    const first = (Object.keys(draft) as (keyof Draft)[]).find(key => next[key]);
    if (first) document.getElementById(`${id}-${first}`)?.focus();
    return !first;
  };
  return { draft, setDraft, field, validate, failed: Object.values(errors).some(Boolean), reset: (value: Draft) => { setDraft(value); setErrors({}); } };
}

const productOf = (draft: Draft, base: Pick<Product, "reorder" | "sold" | "note">): Product => ({
  ...base,
  name: draft.name.trim(),
  sku: draft.sku.trim(),
  category: draft.category.trim() || "Tools",
  price: Number(draft.price),
  stock: Number(draft.stock),
});

function EditScreen({ product, dirtyStart, width, onSave }: { product: Product; dirtyStart: boolean; width: PageWidth; onSave: (sku: string, next: Product) => void }) {
  const [saved, setSaved] = useState(() => draftOf(product));
  const form = useProductForm(dirtyStart ? { ...saved, stock: String(product.stock + product.reorder) } : saved, []);
  const dirty = !same(form.draft, saved);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.validate()) return;
    const next = productOf(form.draft, product);
    setSaved(draftOf(next));
    form.reset(draftOf(next));
    onSave(product.sku, next);
  };
  return <FormPage
    width={width}
    title={`Edit ${saved.name}`}
    mode="edit"
    submitLabel="Save"
    onSubmit={submit}
    onDiscard={() => form.reset(saved)}
    dirty={dirty}
    failed={form.failed}
    message={form.failed ? "Fix the marked fields, then save." : dirty ? <><strong>Unsaved changes.</strong> Save them before you leave.</> : "Saved."}
  >
    <FormField label="Name" required {...form.field("name")} />
    <FormField label="SKU" readOnly hint="The SKU stays the same for the life of the product." {...form.field("sku")} />
    <FormField label="Category" {...form.field("category")} />
    <FormField label="Price (USD)" inputMode="decimal" {...form.field("price")} />
    <FormField label="Stock" inputMode="numeric" hint={`The shop reorders at ${product.reorder} units.`} {...form.field("stock")} />
  </FormPage>;
}

function CreateScreen({ width, taken, go, onCreate }: { width: PageWidth; taken: string[]; go: Go; onCreate: (product: Product) => void }) {
  const form = useProductForm({ name: "", sku: "", category: "Tools", price: "", stock: "0" }, taken);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.validate()) onCreate(productOf(form.draft, { reorder: 10, sold: 0, note: "New in the catalog." }));
  };
  return <FormPage
    width={width}
    title="New product"
    mode="create"
    submitLabel="Create product"
    onSubmit={submit}
    onCancel={() => go("list")}
    failed={form.failed}
    message={form.failed ? "Fix the marked fields, then create the product." : undefined}
  >
    <FormField label="Name" required {...form.field("name")} />
    <FormField label="SKU" required hint="Three letters, a dash and four digits." autoCapitalize="characters" spellCheck={false} {...form.field("sku")} />
    <FormField label="Category" {...form.field("category")} />
    <FormField label="Price (USD)" required inputMode="decimal" {...form.field("price")} />
    <FormField label="Stock" inputMode="numeric" {...form.field("stock")} />
  </FormPage>;
}

const customers = ["Rin Quietstep", "Taro Nightwalk", "Mika Rooftop"];
const ordersOf = (product: Product) => product.sold === 0 ? [] : customers.map((customer, index) => ({
  id: `#${4828 - index * 13 - (product.sku.charCodeAt(0) + product.sku.charCodeAt(1)) % 9}`,
  date: ["Sep 26", "Sep 22", "Sep 19"][index],
  customer,
  quantity: [2, 1, 3][index],
  state: index === 2 ? "Returned" : "Shipped",
}));
const movementsOf = (product: Product) => product.sold === 0
  ? [{ date: "Today", reason: "Opening stock", change: product.stock, after: product.stock }]
  : [
    { date: "Sep 26", reason: `Order ${ordersOf(product)[0].id}`, change: -2, after: product.stock },
    { date: "Sep 19", reason: "Stock count", change: -1, after: product.stock + 2 },
    { date: "Sep 02", reason: "Delivery from the supplier", change: product.reorder, after: product.stock + 3 },
  ];

function DetailScreen({ product, width, tab, go }: { product: Product; width: PageWidth; tab: DetailTab; go: Go }) {
  const orders = ordersOf(product);
  return <DetailPage
    width={width}
    title={product.name}
    action={{ label: "Edit product", icon: <Pencil className="icon" aria-hidden="true" />, onClick: () => go("edit") }}
    value={tab}
    onValueChange={next => go("detail", next as DetailTab)}
    tabs={[
      {
        value: "overview",
        label: "Overview",
        content: <KV>
          <KVKey>Status</KVKey><KVValue><StatusBadge tone={tone(product)}>{stockState(product)}</StatusBadge></KVValue>
          <KVKey>SKU</KVKey><KVValue className="mono">{product.sku}</KVValue>
          <KVKey>Category</KVKey><KVValue>{product.category}</KVValue>
          <KVKey>Price</KVKey><KVValue className="mono">{money(product.price)}</KVValue>
          <KVKey>Sold this month</KVKey><KVValue>{product.sold} units</KVValue>
          <KVKey>Catalog note</KVKey><KVValue>{product.note}</KVValue>
        </KV>,
      },
      {
        value: "stock",
        label: "Stock",
        content: <TableFrame frame="none">
          <Table aria-label={`Stock changes of ${product.name}`}>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead>Change</TableHead><TableHead>In stock</TableHead></TableRow></TableHeader>
            <TableBody>
              {movementsOf(product).map(row => <TableRow key={row.date}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell className="mono">{row.change > 0 ? `+${row.change}` : row.change}</TableCell>
                <TableCell className="mono">{row.after}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </TableFrame>,
      },
      orders.length === 0
        ? { value: "orders", label: "Orders", empty: { title: "No orders yet", text: "Orders appear here when a customer buys this product." } }
        : {
          value: "orders",
          label: "Orders",
          content: <TableFrame frame="none">
            <Table aria-label={`Orders with ${product.name}`}>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Units</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.map(order => <TableRow key={order.id}>
                  <TableCell className="mono">{order.id}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="mono">{order.quantity}</TableCell>
                  <TableCell><StatusBadge tone={order.state === "Shipped" ? "success" : "neutral"}>{order.state}</StatusBadge></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </TableFrame>,
        },
    ]}
  />;
}

export function ProductScreens({ screen, layout, tab, products, product, go, open, onCreate, onSave }: {
  screen: ConsoleScreen;
  layout: PageWidth;
  tab: DetailTab;
  products: Product[];
  product: Product;
  go: Go;
  open: (sku: string) => void;
  onCreate: (product: Product) => void;
  onSave: (sku: string, next: Product) => void;
}) {
  return screen === "list" || screen === "empty"
    ? <ProductsScreen key={screen} products={screen === "empty" ? [] : products} width={layout} go={go} open={open} />
    : screen === "edit" || screen === "edit-dirty"
      ? <EditScreen key={`${screen}-${product.sku}`} product={product} dirtyStart={screen === "edit-dirty"} width={layout} onSave={onSave} />
      : screen === "create"
        ? <CreateScreen width={layout} taken={products.map(item => item.sku)} go={go} onCreate={onCreate} />
        : <DetailScreen product={product} width={layout} tab={tab} go={go} />;
}
