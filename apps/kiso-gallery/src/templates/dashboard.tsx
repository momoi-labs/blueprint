import { RefreshCw } from "lucide-react";
import {
  Badge,
  BarGauge,
  Button,
  Card,
  Chart,
  DashboardGrid,
  DashboardPanel,
  Link,
  Meter,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Stat,
  StatDelta,
  StatFoot,
  StatHeader,
  StatLabel,
  StatValue,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";
import { usePaneLayout } from "../../../../kiso/blocks/react-prototype/src/use-pane-layout";
import { crudPath } from "./crud";
import { sales, salesSeries, shopHref, soldByCategory, stockState, useReportRange, whole, type Product } from "./shop-data";

/* The overview follows the dashboard pattern: the range in the page header,
   a cluster of metrics, panels the reader can move and resize, and a short
   "needs attention" table that links into the products list. */
export function DashboardLayout({ products, go, open }: { products: Product[]; go: (path: string) => void; open: (sku: string) => void }) {
  const paneLayout = usePaneLayout("kiso-overview-pane-layout");
  const range = useReportRange();
  const attention = products.filter(product => stockState(product) !== "In stock");
  return (
    <>
      <PageHeader actions={<>
        {range.control}
        <Button size="sm"><RefreshCw className="icon icon-sm" aria-hidden="true" /> Refresh</Button>
      </>}>
        <PageHeaderTitle>Overview</PageHeaderTitle>
        <PageHeaderDescription>Sales and orders this month, and the products to restock.</PageHeaderDescription>
      </PageHeader>
      <Card className="layout-stats">
        {[
          ["Revenue", "$18,420", "+12.4%", "$2,030 more than August"],
          ["Orders", "312", "+9.1%", "26 more than August"],
          ["Average order", "$59.04", "+3.0%", "$1.73 more than August"],
          ["Shipped on time", "96%", "+2%", "Above the 95% target"],
        ].map(([label, value, delta, detail]) => (
          <Stat key={label}>
            <StatHeader>
              <StatLabel>{label}</StatLabel>
              <StatDelta variant="success">{delta}</StatDelta>
            </StatHeader>
            <StatValue>{value}</StatValue>
            <StatFoot>{detail}</StatFoot>
          </Stat>
        ))}
      </Card>
      <DashboardGrid aria-label="Shop activity" {...paneLayout}>
        <DashboardPanel id="activity" title="Orders per day" size={8} min={4} expandable>
          <Chart label="Orders per day" data={range.within(sales)} series={salesSeries} min={0} summary={["avg", "current"]}
            formatTime={range.formatDay} formatValue={whole} onRangeSelect={range.select} />
        </DashboardPanel>
        <DashboardPanel id="delivery" title="Shipping" size={4} min={3}>
          <div className="stack">
            <Meter label="Orders shipped on time" value={96} max={100} valueText="96%" />
            <BarGauge label="Units sold by category" rows={soldByCategory} max={120} />
          </div>
        </DashboardPanel>
        <DashboardPanel id="attention" title="Needs attention" size={12} newRow
          actions={<Link className="t-label" href={shopHref(crudPath("list"))} onClick={event => { event.preventDefault(); go(crudPath("list")); }}>View all products</Link>}>
          <TableFrame>
            <Table aria-label="Products that need attention">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="num">In stock</TableHead>
                  <TableHead className="num">Reorder at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attention.map(product => (
                  <TableRow key={product.sku}>
                    <TableCell>
                      <Link href={shopHref(crudPath("detail"))} onClick={event => { event.preventDefault(); open(product.sku); }}>{product.name}</Link>
                    </TableCell>
                    <TableCell><Badge variant={product.stock === 0 ? "danger" : "warning"}>{stockState(product)}</Badge></TableCell>
                    <TableCell className="num">{product.stock}</TableCell>
                    <TableCell className="num">{product.reorder}</TableCell>
                  </TableRow>
                ))}
                {attention.length === 0 && <TableRow><TableCell colSpan={4} className="muted">Every product is above its reorder point.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableFrame>
        </DashboardPanel>
      </DashboardGrid>
    </>
  );
}
