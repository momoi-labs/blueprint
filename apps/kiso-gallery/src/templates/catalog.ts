import login from "./login.tsx?raw";
import crud from "./crud.tsx?raw";
import dashboard from "./dashboard.tsx?raw";
import charts from "./charts.tsx?raw";
import report from "./report.tsx?raw";
import reportData from "./report-data.tsx?raw";
import workspace from "./workspace.tsx?raw";
import screensDemo from "../../../../kiso/blocks/react-prototype/src/screens-demo.tsx?raw";
import screensRs from "../../../../crates/tui-kiso/examples/screens.rs?raw";

export const docsUrl = "https://github.com/momoi-labs/blueprint/blob/main/kiso/docs/";

/* What a component does in a template, and what it leaves to another one.
   Each pair restates the Purpose section of the component's contract. */
const components = {
  Alert: ["alert.md", "Explains something about this view: a failure, a warning, a next step.", "Not a corner toast, and not the error of one field."],
  Badge: ["badge.md", "Names a state or a class next to something else.", "Not a button and not a count of notifications."],
  BarGauge: ["bar-gauge.md", "Compares labelled measurements on bars that share a maximum.", "Shows no history. Use Chart for that."],
  Button: ["button.md", "Does something: submit, open, save, delete.", "Does not go to a URL. Use Link for that."],
  Card: ["card.md", "Groups one unit of related content on a surface.", "Not a status label, a warning or the application layout."],
  Chart: ["chart.md", "Reads several series across a window of time.", "Not a small trend of one series. Use Sparkline for that."],
  Checkbox: ["checkbox.md", "An independent yes or no, or membership in a list.", "Not an immediate setting. Use Switch for that."],
  DashboardGrid: ["dashboard-grid.md", "Panels on twelve columns that the reader moves and resizes.", "Does not load data. The product stores the layout."],
  Diagram: ["diagram.md", "Shows how the parts of a deployment connect.", "Not a list and not a graph editor."],
  Dialog: ["modal-dialog.md", "Blocks the page for a task or a decision, then returns.", "Not for a message that asks for no decision."],
  Disclosure: ["disclosure.md", "Collapses a related section in place.", "Does not switch views. Use Tabs for that."],
  FormField: ["form-field.md", "One control with its label, help and error.", "Not the whole form or its submit actions."],
  KV: ["kv.md", "Named facts about one object.", "Not a table of many records."],
  Link: ["link.md", "Goes somewhere: a route, a hash, a document.", "Does not run an action on the page. Use Button for that."],
  Meter: ["meter.md", "One measurement against a known limit, or the progress of work.", "Does not mix the two: a task's completion is Progress."],
  PageHeader: ["page-header.md", "The page title and the place for its actions.", "Not the application header or the navigation."],
  Pagination: ["pagination.md", "Position and direct page navigation in a table.", "Does not replace filtering or search."],
  PasswordInput: ["password-input.md", "Collects a secret, masked, with Show and Hide.", "Sets no password policy and checks no strength."],
  Search: ["search.md", "Narrows what is already in view.", "Does not search the whole product or own the data."],
  Select: ["select.md", "Picks exactly one value from a fixed set.", "Takes no free text and no second choice."],
  Sparkline: ["sparkline.md", "The shape of one series in a cell or a Stat.", "Does not answer the value at a given moment."],
  Spinner: ["spinner.md", "Work is happening and its length is unknown.", "Not for known progress or a page skeleton."],
  Stat: ["stat.md", "One named metric with its change and context.", "Draws no frame. Card does that."],
  Table: ["table.md", "Scan, compare, sort and act on many similar items.", "Not a page layout or a list of cards."],
  Tabs: ["tabs.md", "Peer views of the same page.", "Does not say where you are in the product. Breadcrumb does."],
  TimeRangeControl: ["time-range-control.md", "Picks the time range the panels show, with presets and time zone.", "Not a refresh rate picker."],
  Toast: ["toast.md", "A brief outcome, such as Saved or Copied.", "Not for a problem the person must fix. Use Alert for that."],
} as const;

export type ComponentName = keyof typeof components;
export const component = (name: ComponentName) => {
  const [doc, does, doesNot] = components[name];
  return { name, doc, does, doesNot };
};

/* The terminal code of a template: the parts of the tui-kiso `screens`
   example between `// gallery: <ids>` and `// gallery end`. */
function terminal(id: string) {
  const parts = [...screensRs.matchAll(/^[ \t]*\/\/ gallery: ([\w, ]+)\n([\s\S]*?)^[ \t]*\/\/ gallery end\n/gm)]
    .filter(([, ids]) => ids.split(",").map(name => name.trim()).includes(id))
    .map(([, , code]) => {
      const lines = code.replace(/\n+$/, "").split("\n");
      const indent = Math.min(...lines.filter(Boolean).map(line => line.match(/^ */)![0].length));
      return lines.map(line => line.slice(indent)).join("\n");
    });
  return parts.join("\n\n// ...\n\n");
}

export type SourceFile = { name: string; path: string; language: "tsx" | "rust"; code: string };
const react = (name: string, code: string, dir = "apps/kiso-gallery/src/templates/"): SourceFile => ({ name, path: dir + name, language: "tsx", code });
const blocks = "kiso/blocks/react-prototype/src/";
const rust = (id: string): SourceFile => ({ name: "screens.rs", path: "crates/tui-kiso/examples/screens.rs", language: "rust", code: terminal(id) });

export const templates = [
  {
    id: "login",
    label: "Login",
    description: "Sign in to the product. A gate before the application, with access help and recoverable errors.",
    pattern: "login-authentication.md",
    states: ["Success", "Credentials refused", "Service failure", "Connection failure"],
    components: (["Card", "FormField", "PasswordInput", "Alert", "Button", "Spinner", "Disclosure", "Link"] as const).map(component),
    files: [react("login.tsx", login), rust("login")],
  },
  {
    id: "crud",
    label: "CRUD",
    description: "List, open, create and delete records. The everyday work of a product.",
    pattern: "crud.md",
    states: ["Split", "List", "Detail", "Create", "Save error"],
    components: (["PageHeader", "Search", "Select", "Table", "Pagination", "Badge", "Card", "KV", "Meter", "Checkbox", "Tabs", "Dialog", "Toast"] as const).map(component),
    files: [react("crud.tsx", crud), react("screens-demo.tsx", screensDemo, blocks), react("workspace.tsx", workspace), rust("crud")],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "A workspace overview: what needs attention, what is healthy and where to go next.",
    pattern: "dashboard.md",
    states: [],
    components: (["PageHeader", "TimeRangeControl", "Stat", "DashboardGrid", "Chart", "Meter", "BarGauge", "Table", "Badge", "Link"] as const).map(component),
    files: [react("dashboard.tsx", dashboard), react("report-data.tsx", reportData), react("workspace.tsx", workspace), rust("dashboard")],
  },
  {
    id: "charts",
    label: "Charts & diagrams",
    description: "Reports for a time range, and a map of the systems the team ships to.",
    pattern: "report.md",
    states: [],
    components: (["PageHeader", "TimeRangeControl", "DashboardGrid", "Chart", "BarGauge", "Meter", "Sparkline", "Diagram"] as const).map(component),
    files: [react("charts.tsx", charts), react("report-data.tsx", reportData), react("workspace.tsx", workspace), rust("charts")],
  },
  {
    id: "report",
    label: "Report",
    description: "A monthly report read in order and printed: a cover, then sections that each start a page. Print it to see the paper layout.",
    pattern: "report.md",
    // A document for paper: no phone or terminal view.
    paper: true,
    states: [],
    components: (["PageHeader", "Button", "Card", "Stat", "Disclosure", "DashboardGrid", "Chart", "Meter", "Table", "Badge"] as const).map(component),
    files: [react("report.tsx", report)],
  },
] as const;

export type Template = (typeof templates)[number];
