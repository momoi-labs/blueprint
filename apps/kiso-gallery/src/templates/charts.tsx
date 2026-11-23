import { Zap } from "lucide-react";
import {
  BarGauge,
  Chart,
  DashboardGrid,
  DashboardPanel,
  Diagram,
  DiagramEdge,
  DiagramNode,
  DiagramRow,
  Meter,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Sparkline,
} from "@momoi-labs/kiso-react";
import { usePaneLayout } from "../../../../kiso/blocks/react-prototype/src/use-pane-layout";
import { sales, salesSeries, soldByCategory, stock, stockSeries, useReportRange, whole } from "./shop-data";

/* Charts and diagrams on one page: the time range the charts share, a line
   chart, a stacked area, gauges and a sparkline, and a diagram of the systems
   behind the shop. Drag across a chart to narrow the range. */
export function ChartsLayout() {
  const paneLayout = usePaneLayout("kiso-charts-pane-layout");
  const { control, within, formatDay, select } = useReportRange();
  const shown = within(sales);
  return (
    <>
      <PageHeader actions={control}>
        <PageHeaderTitle>Charts</PageHeaderTitle>
        <PageHeaderDescription>Sales and stock in the range, and the systems behind the shop.</PageHeaderDescription>
      </PageHeader>
      <DashboardGrid aria-label="Charts" {...paneLayout}>
        <DashboardPanel id="orders" title="Orders per day" size={8} min={4} expandable>
          <Chart label="Orders per day" data={shown} series={salesSeries} min={0} syncId="reports"
            formatTime={formatDay} formatValue={whole} onRangeSelect={select} />
        </DashboardPanel>
        <DashboardPanel id="categories" title="Units sold by category" size={4} min={3}>
          <BarGauge label="Units sold by category" rows={soldByCategory} max={120} />
        </DashboardPanel>
        <DashboardPanel id="stock" title="Stock by category" size={8} min={4} newRow expandable>
          <Chart label="Units in stock by category" variant="stacked-area" data={within(stock)} series={stockSeries} min={0} syncId="reports"
            formatTime={formatDay} formatValue={whole} onRangeSelect={select} />
        </DashboardPanel>
        <DashboardPanel id="shipping" title="Shipping" size={4} min={3}>
          <div className="stack">
            <Meter label="Orders shipped on time" value={96} max={100} valueText="96%" />
            <Sparkline values={shown.map(sample => sample.values.orders)} height={48} min={0} tone="primary" fill
              label="Orders per day in the range" />
          </div>
        </DashboardPanel>
        <DashboardPanel id="systems" title="Shop systems" size={12} newRow>
          {/* Top to bottom: four stages of two nodes fit the panel beside a
              sidebar and, on a phone, scroll inside the diagram. */}
          <Diagram direction="down"
            label="Shop systems: the storefront repository builds an image that runs as the web and orders services behind tabiandsmoke.example, with a database and a failed cache">
            <DiagramRow>
              <DiagramNode id="route" kind="route" title="tabiandsmoke.example">https://tabiandsmoke.example</DiagramNode>
              <DiagramNode id="repo" kind="repository" title="tabiandsmoke/storefront">{"git.tabiandsmoke.example/storefront\nbranch: main"}</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="image" kind="image" title="storefront:2026.09.18">built 18 Sep, 142 MB</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="web" kind="service" title="shop-web" accent>{"3 replicas\nport: 8000"}</DiagramNode>
              <DiagramNode id="worker" kind="service" title="shop-orders">1 replica</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="db" kind="database" title="shop-db">{"postgres:17\nvolume: shop-data"}</DiagramNode>
              <DiagramNode id="cache" icon={Zap} label="Cache" title="shop-cache" status="failed" borderStyle="dash">redis:7</DiagramNode>
            </DiagramRow>
            <DiagramEdge from="repo" to="image" label="build" />
            <DiagramEdge from="route" to="web" label=":8000" />
            <DiagramEdge from="image" to="web" label="deploy" />
            <DiagramEdge from="image" to="worker" label="deploy" />
            <DiagramEdge from={["web", "worker"]} to="db" label="DATABASE_URL" />
            <DiagramEdge from="web" to="cache" label="REDIS_URL" line="dotted" tone="danger" />
          </Diagram>
        </DashboardPanel>
      </DashboardGrid>
    </>
  );
}
