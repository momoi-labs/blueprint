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
import { activity, activitySeries, backlog, backlogSeries, openByOwner, useReportRange, whole } from "./report-data";
import { WorkspacePreview } from "./workspace";

/* Charts and diagrams on one page: the time range the charts share, a line
   chart, a stacked area, gauges and a sparkline, and a diagram of the systems
   the team ships to. Drag across a chart to narrow the range. */
export function ChartsLayout() {
  const paneLayout = usePaneLayout("kiso-reports-pane-layout");
  const { control, within, formatDay, select } = useReportRange();
  const shown = within(activity);
  return (
    <WorkspacePreview page="Reports">
      <PageHeader actions={control}>
        <PageHeaderTitle asChild><h2>Reports</h2></PageHeaderTitle>
        <PageHeaderDescription>Throughput and delivery in the range, and the systems the team ships to.</PageHeaderDescription>
      </PageHeader>
      <DashboardGrid aria-label="Reports" {...paneLayout}>
        <DashboardPanel id="tasks" title="Tasks per day" size={8} min={4} expandable>
          <Chart label="Tasks per day" data={shown} series={activitySeries} min={0} syncId="reports"
            formatTime={formatDay} formatValue={whole} onRangeSelect={select} />
        </DashboardPanel>
        <DashboardPanel id="owners" title="Open tasks by owner" size={4} min={3}>
          <BarGauge label="Open tasks by owner" rows={openByOwner} max={16} />
        </DashboardPanel>
        <DashboardPanel id="backlog" title="Backlog by status" size={8} min={4} newRow expandable>
          <Chart label="Backlog by status" variant="stacked-area" data={within(backlog)} series={backlogSeries} min={0} syncId="reports"
            formatTime={formatDay} formatValue={whole} onRangeSelect={select} />
        </DashboardPanel>
        <DashboardPanel id="delivery" title="On-time delivery" size={4} min={3}>
          <div className="stack">
            <Meter label="Delivered on time" value={94} max={100} valueText="94%" />
            <Sparkline values={shown.map(sample => sample.values.completed)} height={48} min={0} tone="primary" fill
              label="Tasks completed per day in the range" />
          </div>
        </DashboardPanel>
        <DashboardPanel id="pipeline" title="Delivery pipeline" size={12} newRow>
          {/* Top to bottom: four stages of two nodes fit the panel beside a
              sidebar and, on a phone, scroll inside the diagram. */}
          <Diagram direction="down"
            label="Delivery pipeline: the website repository builds an image that runs as the web and worker services behind northstar.example, with a database and a failed cache">
            <DiagramRow>
              <DiagramNode id="route" kind="route" title="northstar.example">https://northstar.example</DiagramNode>
              <DiagramNode id="repo" kind="repository" title="northstar/website">{"github.com/northstar/website\nbranch: main"}</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="image" kind="image" title="website:2026.09.18">built 18 Sep, 142 MB</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="web" kind="service" title="northstar-web" accent>{"3 replicas\nport: 8000"}</DiagramNode>
              <DiagramNode id="worker" kind="service" title="northstar-worker">1 replica</DiagramNode>
            </DiagramRow>
            <DiagramRow>
              <DiagramNode id="db" kind="database" title="northstar-db">{"postgres:17\nvolume: northstar-data"}</DiagramNode>
              <DiagramNode id="cache" icon={Zap} label="Cache" title="northstar-cache" status="failed" borderStyle="dash">redis:7</DiagramNode>
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
    </WorkspacePreview>
  );
}
