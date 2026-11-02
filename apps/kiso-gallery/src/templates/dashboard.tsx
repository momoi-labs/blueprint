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
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";
import { usePaneLayout } from "../../../../kiso/blocks/react-prototype/src/use-pane-layout";
import { activity, activitySeries, openByOwner, useReportRange, whole } from "./report-data";
import { WorkspacePreview } from "./workspace";

const attention = [
  ["Brand guidelines", "Blocked", "Waiting on the legal review", "3 days"],
  ["Customer interviews", "Overdue", "Due Sep 12, 4 of 10 tasks open", "6 days"],
];

/* The overview follows the dashboard pattern: the month in the page header,
   a cluster of metrics, panels the reader can move and resize, and a short
   "needs attention" table that links into the projects list. */
export function DashboardLayout() {
  const paneLayout = usePaneLayout("kiso-overview-pane-layout");
  const range = useReportRange();
  return (
    <WorkspacePreview page="Overview">
      <PageHeader actions={<>
        {range.control}
        <Button size="sm"><RefreshCw className="icon icon-sm" aria-hidden="true" /> Refresh</Button>
      </>}>
        <PageHeaderTitle asChild><h2>Overview</h2></PageHeaderTitle>
        <PageHeaderDescription>What needs attention, what is healthy and where to go next.</PageHeaderDescription>
      </PageHeader>
      <Card className="layout-stats">
        {[
          ["Active projects", "24", "+4", "4 projects started this month"],
          ["Tasks completed", "186", "+18.6%", "32 more than last month"],
          ["Team members", "12", "+2", "Across 3 working groups"],
          ["On-time delivery", "94.2%", "+2.1%", "Above the 90% target"],
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
      <DashboardGrid aria-label="Workspace activity" {...paneLayout}>
        <DashboardPanel id="activity" title="Tasks per day" size={8} min={4} expandable>
          <Chart label="Tasks per day" data={range.within(activity)} series={activitySeries} min={0} summary={["avg", "current"]}
            formatTime={range.formatDay} formatValue={whole} onRangeSelect={range.select} />
        </DashboardPanel>
        <DashboardPanel id="delivery" title="Delivery" size={4} min={3}>
          <div className="stack">
            <Meter label="Tasks delivered on time" value={94} max={100} valueText="94%" />
            <BarGauge label="Open tasks by owner" rows={openByOwner} max={16} />
          </div>
        </DashboardPanel>
        <DashboardPanel id="attention" title="Needs attention" size={12} newRow
          actions={<Link className="t-label" href="#example/crud/list/success">View all projects</Link>}>
          <Table aria-label="Projects that need attention">
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attention.map(([name, status, issue, since]) => (
                <TableRow key={name}>
                  <TableCell><Link href="#example/crud/detail/success">{name}</Link></TableCell>
                  <TableCell><Badge variant={status === "Blocked" ? "danger" : "warning"}>{status}</Badge></TableCell>
                  <TableCell>{issue}</TableCell>
                  <TableCell className="mono">{since}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardPanel>
      </DashboardGrid>
    </WorkspacePreview>
  );
}
