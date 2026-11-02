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
  type ChartSeries,
} from "@momoi-labs/kiso-react";

const projects = [
  { name: "Website refresh", category: "Design", status: "In progress", owner: "Alex Morgan", due: "Sep 18", tasks: "18 / 24" },
  { name: "Getting started guide", category: "Content", status: "In review", owner: "Sam Rivera", due: "Sep 20", tasks: "12 / 14" },
  { name: "Customer interviews", category: "Research", status: "Completed", owner: "Jordan Lee", due: "Sep 22", tasks: "8 / 8" },
  { name: "Mobile experience", category: "Product", status: "In progress", owner: "Casey Park", due: "Sep 25", tasks: "6 / 18" },
  { name: "Brand guidelines", category: "Design", status: "Planned", owner: "Alex Morgan", due: "Sep 28", tasks: "0 / 12" },
];

function Status({ value }: { value: string }) {
  const variant = value === "Completed" ? "success" : value === "In review" ? "warning" : value === "In progress" ? "info" : "neutral";
  return <Badge variant={variant}>{value}</Badge>;
}

const reportStart = Date.UTC(2026, 8, 1);
const reportSeries: ChartSeries[] = [
  { key: "completed", label: "Completed", slot: 1 },
  { key: "opened", label: "Opened", slot: 2 },
];
const reportData = Array.from({ length: 30 }, (_, index) => ({
  timestamp: reportStart + index * 86_400_000,
  values: {
    completed: Math.round(5 + index / 4 + Math.sin(index / 2) * 2),
    opened: Math.round(7 + Math.cos(index / 3) * 2),
  },
}));
const reportDay = (value: number) => new Date(value).toISOString().slice(5, 10);

// A report is read in order and printed. Its panels are one static column,
// and the page is as wide as the sheet, so the chart draws at the size it
// prints. The Activity section is a Disclosure, as on a screen that shares
// it; Method stays closed and still prints its content.
export function ReportLayout() {
  return (
    <div className="page">
      <PageHeader
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="icon icon-sm" aria-hidden="true" /> Print report
          </Button>
        }
      >
        <p className="report-kicker">Workspace report</p>
        <PageHeaderTitle>Northstar, September 2026</PageHeaderTitle>
        <PageHeaderDescription>Team workspace · 1 to 30 September · prepared on 1 October</PageHeaderDescription>
      </PageHeader>
      <div className="report">
        <p>
          The team completed 186 tasks across 24 active projects. Delivery stayed
          above the 90% target for the whole month.
        </p>
        <section aria-labelledby="report-summary">
          <h2 id="report-summary">Summary</h2>
          <Card className="layout-stats">
            {[
              ["Active projects", "24", "4 projects started this month"],
              ["Tasks completed", "186", "32 more than last month"],
              ["Team members", "12", "Across 3 working groups"],
              ["On-time delivery", "94%", "Above the 90% target"],
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
        <Disclosure summary="Activity" open>
          <DashboardGrid aria-label="Activity" static>
            <DashboardPanel id="tasks" title="Tasks per day">
              <p className="muted">Tasks completed and opened each day of the month.</p>
              <div>
                <Chart label="Tasks per day" data={reportData} series={reportSeries} min={0}
                  summary={["p50", "p95", "current"]} formatTime={reportDay} formatValue={(value) => value.toFixed(0)} />
              </div>
            </DashboardPanel>
            <DashboardPanel id="delivery" title="On-time delivery">
              <Meter label="Tasks delivered on time" value={94} max={100} />
            </DashboardPanel>
          </DashboardGrid>
        </Disclosure>
        <section aria-labelledby="report-projects">
          <h2 id="report-projects">Projects</h2>
          <DashboardGrid aria-label="Projects" static>
            <DashboardPanel id="projects" title="Projects by status">
              <TableFrame>
                <Table aria-label="Projects by status">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.name}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.category}</TableCell>
                        <TableCell><Status value={project.status} /></TableCell>
                        <TableCell>{project.owner}</TableCell>
                        <TableCell>{project.due}</TableCell>
                        <TableCell className="mono">{project.tasks}</TableCell>
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
            Counts come from the project tracker at midnight UTC each day. A task
            counts as on time when it closes on or before its due date.
          </p>
        </Disclosure>
      </div>
    </div>
  );
}
