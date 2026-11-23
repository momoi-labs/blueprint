import {
  Link,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";
import { reports, shopHref } from "./shop-data";

export function ReportsLayout({ go }: { go: (path: string) => void }) {
  return <>
    <PageHeader>
      <PageHeaderTitle>Reports</PageHeaderTitle>
      <PageHeaderDescription>One report for each closed month. Open a month to read or print it.</PageHeaderDescription>
    </PageHeader>
    <TableFrame data-fill="false">
      <Table aria-label="Monthly reports">
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Shipped on time</TableHead>
            <TableHead>Prepared</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map(report => (
            <TableRow key={report.id}>
              <TableCell>
                <Link href={shopHref(`report/${report.id}`)} onClick={event => { event.preventDefault(); go(`report/${report.id}`); }}>{report.month}</Link>
              </TableCell>
              <TableCell className="mono">{report.orders}</TableCell>
              <TableCell className="mono">{report.revenue}</TableCell>
              <TableCell className="mono">{report.onTime}%</TableCell>
              <TableCell>{report.prepared}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="table-footer"><span>{reports.length} reports</span></div>
    </TableFrame>
  </>;
}
