import { useEffect, useRef, useState } from "react";
import {
  Badge, Button, Card, Steps, Switch,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@momoi-labs/kiso-react";
import { RotateCcw } from "lucide-react";

const pieces = [
  { id: "header", label: "Header" },
  { id: "sidebar", label: "Sidebar" },
  { id: "content", label: "Content" },
] as const;

const seenKey = "kiso-gallery-shell-assembly";
const stepDelay = 1000;
const markDelay = 420;

function seen() {
  try { return localStorage.getItem(seenKey) === "done"; } catch { return false; }
}

// The shell assembles itself once, on the first visit, then the reader owns the switches.
export function ShellAssembly() {
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [on, setOn] = useState<boolean[]>(() => pieces.map(() => seen()));
  const [current, setCurrent] = useState<string | null>(null);
  const [status, setStatus] = useState("A shell, composed from pieces.");
  const [narrow, setNarrow] = useState(false);

  // Below 345px the steps sit above the shell, so the shell keeps its width.
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setNarrow((entry?.contentRect.width ?? 0) < 345));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCurrent(null);
  };

  const play = () => {
    stop();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(pieces.map(() => true));
      setStatus("The complete shell.");
      return;
    }
    setOn(pieces.map(() => false));
    setStatus("Assembling the shell…");
    pieces.forEach((piece, index) => {
      const start = 350 + index * stepDelay;
      timers.current.push(window.setTimeout(() => setCurrent(piece.id), start));
      timers.current.push(window.setTimeout(() => {
        setCurrent(null);
        setOn(value => value.map((item, at) => at === index ? true : item));
        if (index === pieces.length - 1) {
          setStatus("The complete shell.");
          try { localStorage.setItem(seenKey, "done"); } catch { /* Private mode keeps the intro per visit. */ }
        }
      }, start + markDelay));
    });
  };

  useEffect(() => {
    if (seen() || !root.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    }, { threshold: 0.4 });
    observer.observe(root.current);
    return () => { observer.disconnect(); timers.current.forEach(clearTimeout); };
    // play only reads refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (index: number, checked: boolean) => {
    stop();
    const next = on.map((item, at) => at === index ? checked : item);
    setOn(next);
    const count = next.filter(Boolean).length;
    setStatus(count === pieces.length ? "The complete shell." : count === 0 ? "No pieces. Turn one on." : `${pieces[index]!.label} ${checked ? "on" : "off"}.`);
  };

  const [header, sidebar, content] = on;
  return <div ref={root} className="studio-live-example shell-assembly" data-narrow={narrow}>
    <div className="shell-assembly-controls">
      <Steps
        label="Shell pieces"
        orientation={narrow ? "horizontal" : "vertical"}
        responsive={false}
        current={current}
        labels={{ completed: "On", upcoming: "Off", current: "Adding" }}
        items={pieces.map((piece, index) => ({
          id: piece.id,
          status: on[index] ? "completed" : "upcoming",
          label: <span className="shell-assembly-step">
            <span>{piece.label}</span>
            <Switch aria-label={piece.label} checked={on[index]} onCheckedChange={checked => toggle(index, checked)} />
          </span>,
        }))}
      />
      <Button variant="ghost" size="xs" className="btn-icon shell-assembly-replay" aria-label="Replay" title="Replay" onClick={play}><RotateCcw aria-hidden /></Button>
    </div>
    <div className="shell-assembly-stage" data-header={header} data-sidebar={sidebar} data-content={content}>
      <Card className="shell-assembly-piece shell-assembly-header" aria-hidden={!header}>
        <strong>Northstar</strong><Badge>Workspace</Badge>
      </Card>
      <Card className="shell-assembly-piece shell-assembly-sidebar" aria-hidden={!sidebar}>
        <strong>Projects</strong><span className="muted">Reports</span><span className="muted">Settings</span>
      </Card>
      <Card className="shell-assembly-piece shell-assembly-content" aria-hidden={!content}>
        <strong>Projects</strong>
        <Table aria-label="Example projects" density="compact">
          <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell>Website</TableCell><TableCell><Badge variant="info">Active</Badge></TableCell></TableRow>
            <TableRow><TableCell>Library</TableCell><TableCell><Badge variant="success">Done</Badge></TableCell></TableRow>
            <TableRow><TableCell>Docs</TableCell><TableCell><Badge>Draft</Badge></TableCell></TableRow>
          </TableBody>
        </Table>
      </Card>
      <p className="shell-assembly-empty hatch" aria-hidden={on.some(Boolean)}>Turn on a piece.</p>
    </div>
    <p className="shell-assembly-status muted" role="status">{status}</p>
  </div>;
}
