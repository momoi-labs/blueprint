import { useId, useState } from "react";
import { Button, Table, TableFrame, TableBody, TableCell, TableHead, TableHeader, TableRow, type TableProps } from "@momoi-labs/kiso-react";

export function TableDemo() {
  const id = useId();
  const [density, setDensity] = useState<NonNullable<TableProps["density"]>>("comfortable");
  const [frame, setFrame] = useState<"default" | "none">("default");
  const [header, setHeader] = useState<NonNullable<TableProps["header"]>>("tinted");
  const [expanded, setExpanded] = useState(false);
  return <div className="stack">
    <div className="row-wrap">
      <label className="field">Density<select className="select" value={density} onChange={event => setDensity(event.target.value as typeof density)}>
        <option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option>
      </select></label>
      <label className="field">Frame<select className="select" value={frame} onChange={event => setFrame(event.target.value as typeof frame)}>
        <option value="default">Default</option><option value="none">None</option>
      </select></label>
      <label className="field">Header<select className="select" value={header} onChange={event => setHeader(event.target.value as typeof header)}>
        <option value="tinted">Tinted</option><option value="plain">Plain</option>
      </select></label>
    </div>
    <TableFrame frame={frame}>
      <Table density={density} header={header} aria-label="Memory comparison">
        <TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead className="num">Default</TableHead><TableHead className="num">Recommended</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow><TableCell className="mono">shared_buffers</TableCell><TableCell className="num">128 MB</TableCell><TableCell className="num">512 MB</TableCell></TableRow>
          <TableRow><TableCell><Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={`${id}-detail`} onClick={() => setExpanded(!expanded)}><span aria-hidden="true">{expanded ? "−" : "+"}</span><span className="mono">work_mem</span></Button></TableCell><TableCell className="num">4 MB</TableCell><TableCell className="num">10 MB</TableCell></TableRow>
          <TableRow id={`${id}-detail`} hidden={!expanded} className="table-detail"><TableCell colSpan={3}><p>Memory is allocated per operation. Account for concurrent operations before choosing a value.</p></TableCell></TableRow>
        </TableBody>
      </Table>
    </TableFrame>
  </div>;
}
