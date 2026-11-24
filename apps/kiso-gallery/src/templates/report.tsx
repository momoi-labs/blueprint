import { Printer } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Chart,
  DashboardGrid,
  DashboardPanel,
  Disclosure,
  Meter,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Stat,
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
import { money, salesSeries, stockState, type MonthlyReport, type Product } from "./shop-data";

function Status({ value }: { value: string }) {
  const variant = value === "In stock" ? "success" : value === "Low stock" ? "warning" : "danger";
  return <Badge variant={variant}>{value}</Badge>;
}

const reportDay = (value: number) => new Date(value).toISOString().slice(5, 10);

// A report is read in order and printed. Its panels are one static column,
// and the page is as wide as the sheet, so the chart draws at the size it
// prints. The Sales section is a Disclosure, as on a screen that shares
// it; Method stays closed and still prints its content.
export function ReportLayout({ report, products }: { report: MonthlyReport; products: Product[] }) {
  const daily = Array.from({ length: report.days }, (_, index) => ({
    timestamp: report.start + index * 86_400_000,
    values: {
      orders: Math.round(report.orders / report.days + Math.sin(index / 2) * 3),
      returns: Math.round(1 + Math.cos(index / 3)),
    },
  }));
  const sold = [...products].sort((first, second) => second.sold - first.sold);
  return (
    <>
      <PageHeader
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="icon icon-sm" aria-hidden="true" /> Print report
          </Button>
        }
      >
        <p className="report-kicker">Shop report</p>
        <PageHeaderTitle>Tabi & Smoke, {report.month}</PageHeaderTitle>
        <PageHeaderDescription>Back office · {report.period} · prepared on {report.prepared}</PageHeaderDescription>
      </PageHeader>
      <div className="report">
        <p>
          The shop took {report.orders} orders for {report.revenue} in revenue.
          {report.onTime >= 95 ? " Shipping stayed above the 95% target for the whole month." : " Shipping fell below the 95% target this month."}
        </p>
        <section aria-labelledby="report-summary">
          <h2 id="report-summary">Summary</h2>
          <Card className="layout-stats">
            {[
              ["Revenue", report.revenue, "After refunds, before tax"],
              ["Orders", String(report.orders), "Paid orders in the month"],
              ["Average order", report.average, "Revenue for each order"],
              ["Shipped on time", `${report.onTime}%`, "The target is 95%"],
            ].map(([label, value, detail]) => (
              <Stat key={label}>
                <StatHeader>
                  <StatLabel>{label}</StatLabel>
                </StatHeader>
                <StatValue>{value}</StatValue>
                <StatFoot>{detail}</StatFoot>
              </Stat>
            ))}
          </Card>
        </section>
        <Disclosure summary="Sales" open>
          <DashboardGrid aria-label="Sales" static>
            <DashboardPanel id="orders" title="Orders per day">
              <p className="muted">Orders paid and returned each day of the month.</p>
              <div>
                <Chart label="Orders per day" data={daily} series={salesSeries} min={0}
                  summary={["p50", "p95", "current"]} formatTime={reportDay} formatValue={(value) => value.toFixed(0)} />
              </div>
            </DashboardPanel>
            <DashboardPanel id="shipping" title="Shipping">
              <Meter label="Orders shipped on time" value={report.onTime} max={100} />
            </DashboardPanel>
          </DashboardGrid>
        </Disclosure>
        <section aria-labelledby="report-products">
          <h2 id="report-products">Products</h2>
          <DashboardGrid aria-label="Products" static>
            <DashboardPanel id="products" title="Products by units sold">
              <TableFrame>
                <Table aria-label="Products by units sold">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="num">Price</TableHead>
                      <TableHead className="num">Sold</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sold.map((product) => (
                      <TableRow key={product.sku}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="mono">{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="num">{money(product.price)}</TableCell>
                        <TableCell className="num">{product.sold}</TableCell>
                        <TableCell><Status value={stockState(product)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableFrame>
            </DashboardPanel>
          </DashboardGrid>
        </section>
        <Disclosure summary="Method">
          <p>
            Counts come from the order system at midnight UTC each day. An order
            counts as on time when it ships within two working days.
          </p>
        </Disclosure>
      </div>
    </>
  );
}
