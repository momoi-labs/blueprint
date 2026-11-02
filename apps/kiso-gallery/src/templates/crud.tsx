import { useId } from "react";
import { Plus } from "lucide-react";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  KV,
  KVKey,
  KVValue,
  Label,
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  Pagination,
  PaginationEllipsis,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
  Progress,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@momoi-labs/kiso-react";
import { CreateProjectDialog } from "../../../../kiso/blocks/react-prototype/src/screens-demo";
import { WorkspacePreview } from "./workspace";

/* Projects as a list with the selected record beside it. The list, detail
   and create screens on their own come from screens-demo.tsx. */
const projects = [
  {
    name: "Website refresh",
    category: "Design",
    status: "In progress",
    owner: "Alex Morgan",
    due: "Sep 18",
    tasks: "18 / 24",
  },
  {
    name: "Getting started guide",
    category: "Content",
    status: "In review",
    owner: "Sam Rivera",
    due: "Sep 20",
    tasks: "12 / 14",
  },
  {
    name: "Customer interviews",
    category: "Research",
    status: "Completed",
    owner: "Jordan Lee",
    due: "Sep 22",
    tasks: "8 / 8",
  },
  {
    name: "Mobile experience",
    category: "Product",
    status: "In progress",
    owner: "Casey Park",
    due: "Sep 25",
    tasks: "6 / 18",
  },
  {
    name: "Brand guidelines",
    category: "Design",
    status: "Planned",
    owner: "Alex Morgan",
    due: "Sep 28",
    tasks: "0 / 12",
  },
];

function Status({ value }: { value: string }) {
  return (
    <Badge
      variant={
        value === "Completed"
          ? "success"
          : value === "In review"
          ? "warning"
          : value === "In progress"
          ? "info"
          : "neutral"
      }
    >
      {value}
    </Badge>
  );
}

function ProjectTable() {
  return (
    <TableFrame>
      <Table aria-label="Sample projects">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox aria-label="Select all sample projects" />
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>
              <span className="muted">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow key={project.name} aria-selected={index === 0}>
              <TableCell>
                <Checkbox
                  aria-label={`Select ${project.name}`}
                  defaultChecked={index === 0}
                />
              </TableCell>
              <TableCell>
                <span className="layout-project-name">{project.name}</span>
                <p className="muted t-label">{project.category}</p>
              </TableCell>
              <TableCell>
                <Status value={project.status} />
              </TableCell>
              <TableCell className="mono">{project.due}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="xs"
                  className="btn-icon"
                  aria-label={`Example actions for ${project.name}`}
                >
                  ⋯
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="table-footer">
        <span>5 of 24 projects</span>
        <Pagination>
          <PaginationPrevious disabled />
          <PaginationPage active>1</PaginationPage>
          <PaginationPage>2</PaginationPage>
          <PaginationPage>3</PaginationPage>
          <PaginationEllipsis />
          <PaginationPage>5</PaginationPage>
          <PaginationNext />
        </Pagination>
      </div>
    </TableFrame>
  );
}

const milestones = [
  ["Discovery & research", true],
  ["Page structure", true],
  ["Visual design", false],
  ["Final review", false],
] as const;

export function ListDetailLayout({ createFails = false }: { createFails?: boolean }) {
  const id = useId();
  return (
    <WorkspacePreview page="Projects">
      <PageHeader actions={
        <CreateProjectDialog fail={createFails} trigger={
          <Button variant="primary" size="sm">
            <Plus className="icon icon-sm" aria-hidden="true" /> New project
          </Button>} />}>
        <PageHeaderTitle asChild><h2>Projects</h2></PageHeaderTitle>
        <PageHeaderDescription>Plan, organize and keep track of your team's work.</PageHeaderDescription>
      </PageHeader>
      <div className="layout-list-detail">
        <div className="stack">
          <div className="list-filters">
            <Search aria-label="Search projects" placeholder="Search projects" readOnly />
            <Select defaultValue="all">
              <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="progress">In progress</SelectItem>
                <SelectItem value="review">In review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ProjectTable />
          <Alert variant="info">
            <AlertContent>
              <AlertTitle>Everything in one place</AlertTitle>
              <AlertDescription>
                Keep project notes, owners and milestones alongside your work.
              </AlertDescription>
            </AlertContent>
          </Alert>
        </div>
        <Card>
          <CardHeader>
            <p className="t-caps">Selected project · PRJ-001</p>
            <h3 className="t-h2">Website refresh</h3>
            <div>
              <Status value="In progress" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="muted">
              Update the website with a clearer structure, new project pages and
              a simpler contact flow.
            </p>
            <KV>
              <KVKey>Owner</KVKey>
              <KVValue>Alex Morgan</KVValue>
              <KVKey>Due date</KVKey>
              <KVValue>Sep 18, 2026</KVValue>
              <KVKey>Category</KVKey>
              <KVValue>Design</KVValue>
              <KVKey>Priority</KVKey>
              <KVValue>High</KVValue>
            </KV>
            <Separator />
            <Progress label="Progress" value={18} max={24} valueText="18 of 24 tasks" />
            <div className="stack-sm">
              <h4 className="t-label">Milestones</h4>
              {milestones.map(([label, done], index) => (
                <div className="row" key={label}>
                  <Checkbox id={`${id}-milestone-${index}`} defaultChecked={done} />
                  <Label htmlFor={`${id}-milestone-${index}`}>{label}</Label>
                </div>
              ))}
            </div>
            <Separator />
            <div>
              <p className="t-label">Latest update</p>
              <p className="muted t-label">
                Sam added the first draft of the project pages.
              </p>
              <p className="muted t-label">Today at 10:42 AM</p>
            </div>
          </CardContent>
          <CardFooter>
              <Button size="sm">View activity</Button>
              <Button variant="primary" size="sm">
                Edit project
              </Button>
          </CardFooter>
        </Card>
      </div>
    </WorkspacePreview>
  );
}
