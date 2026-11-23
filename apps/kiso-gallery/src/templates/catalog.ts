import componentOrbit from "../component-orbit.tsx?raw";
import foundationLab from "../foundation-lab.tsx?raw";
import landingCss from "../landing.css?raw";
import heroPanels from "../hero-panels.tsx?raw";
import shellAssembly from "../shell-assembly.tsx?raw";
import landing from "../intro.tsx?raw";
import login from "./login.tsx?raw";
import crud from "./crud.tsx?raw";
import dashboard from "./dashboard.tsx?raw";
import charts from "./charts.tsx?raw";
import report from "./report.tsx?raw";
import reports from "./reports.tsx?raw";
import shop from "./shop.tsx?raw";
import shopData from "./shop-data.tsx?raw";
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
  CodeBlock: ["code-block.md", "Shows read-only code: a command to run, with copy.", "Does not edit code. Use CodeEditor for that."],
  ConsoleShell: ["console-shell.md", "The console frame: sidebar, breadcrumb, account menu and the one page.", "Does not hold the page content. ListPage, FormPage and DetailPage do."],
  Chart: ["chart.md", "Reads several series across a window of time.", "Not a small trend of one series. Use Sparkline for that."],
  Checkbox: ["checkbox.md", "An independent yes or no, or membership in a list.", "Not an immediate setting. Use Switch for that."],
  DashboardGrid: ["dashboard-grid.md", "Panels on twelve columns that the reader moves and resizes.", "Does not load data. The product stores the layout."],
  DetailPage: ["detail-page.md", "One record: its title, one action and tabs with content or an empty state.", "Does not edit the record. Use FormPage for that."],
  Diagram: ["diagram.md", "Shows how the parts of a deployment connect.", "Not a list and not a graph editor."],
  Dialog: ["modal-dialog.md", "Blocks the page for a task or a decision, then returns.", "Not for a message that asks for no decision."],
  Disclosure: ["disclosure.md", "Collapses a related section in place.", "Does not switch views. Use Tabs for that."],
  FormPage: ["form-page.md", "A create or edit form in a card, with its title and save actions.", "Does not validate or save. The product does."],
  FormField: ["form-field.md", "One control with its label, help and error.", "Not the whole form or its submit actions."],
  Input: ["input.md", "Collects a single-line value with native input semantics.", "Does not supply its field label or validation message. Use FormField for those."],
  KV: ["kv.md", "Named facts about one object.", "Not a table of many records."],
  Link: ["link.md", "Goes somewhere: a route, a hash, a document.", "Does not run an action on the page. Use Button for that."],
  ListPage: ["list-page.md", "A list of records: title, create action, filters, table, count and empty state.", "Does not fetch, filter or page the records. The product does."],
  Meter: ["meter.md", "One measurement against a known limit, or the progress of work.", "Does not mix the two: a task's completion is Progress."],
  PageHeader: ["page-header.md", "The page title and the place for its actions.", "Not the application header or the navigation."],
  Pagination: ["pagination.md", "Position and direct page navigation in a table.", "Does not replace filtering or search."],
  PasswordInput: ["password-input.md", "Collects a secret, masked, with Show and Hide.", "Sets no password policy and checks no strength."],
  Search: ["search.md", "Narrows what is already in view.", "Does not search the whole product or own the data."],
  Select: ["select.md", "Picks exactly one value from a fixed set.", "Takes no free text and no second choice."],
  Sparkline: ["sparkline.md", "The shape of one series in a cell or a Stat.", "Does not answer the value at a given moment."],
  Spinner: ["spinner.md", "Work is happening and its length is unknown.", "Not for known progress or a page skeleton."],
  RadioGroup: ["radio-group.md", "Selects one value from visible options.", "Not navigation between pages."],
  StatusBadge: ["status-badge.md", "The state of a resource, with a tone.", "Not a filter chip and not a count."],
  Stat: ["stat.md", "One named metric with its change and context.", "Draws no frame. Card does that."],
  Steps: ["steps.md", "Shows position in a bounded guided flow.", "Does not validate, complete or navigate. The caller owns that."],
  SiteSection: ["site-section.md", "A full-width band of a site page, with a head, a body and a foot.", "Not a panel inside an application screen. Use Card or Page for that."],
  SiteHeader: ["site-header.md", "A site's top bar: brand, links and actions, sticky or over the first section.", "Not an application header. Use Header in ApplicationShell for that."],
  SiteFooter: ["site-footer.md", "A site page's last line: a start and an end.", "Not navigation for the whole product."],
  SiteHeading: ["site-heading.md", "A section's eyebrow, title, description and actions.", "Not a page title in an application. Use PageHeader for that."],
  FeatureGrid: ["feature-grid.md", "Short facts side by side in joined cells.", "Not data to compare. Use Table for that."],
  FeatureList: ["feature-list.md", "Facts as a list, each with a lead.", "Not steps in order. Use Steps for that."],
  WindowFrame: ["window-frame.md", "Window or terminal chrome around an example.", "Not an application window. It frames a picture of one."],
  PerspectiveStack: ["perspective-stack.md", "Pages or cards fanned in depth.", "Not a carousel. Every item stays in view."],
  Switch: ["switch.md", "Changes one boolean setting immediately.", "Not a choice saved with a form. Use Checkbox for that."],
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

export type SourceFile = { name: string; path: string; language: "tsx" | "rust" | "css"; code: string };
const react = (name: string, code: string, dir = "apps/kiso-gallery/src/templates/"): SourceFile => ({ name, path: dir + name, language: "tsx", code });
const rust = (id: string): SourceFile => ({ name: "screens.rs", path: "crates/tui-kiso/examples/screens.rs", language: "rust", code: terminal(id) });

const app = [react("shop.tsx", shop), react("shop-data.tsx", shopData)];

export const templates = [
  {
    id: "login",
    label: "Login",
    description: "Staff sign in to the back office, with access help and recoverable errors.",
    pattern: "login-authentication.md",
    states: ["Success", "Credentials refused", "Service failure", "Connection failure"],
    components: (["Card", "FormField", "PasswordInput", "Alert", "Button", "Spinner", "Disclosure", "Link"] as const).map(component),
    files: [react("login.tsx", login), ...app, rust("login")],
  },
  {
    id: "dashboard",
    label: "Overview",
    description: "Sales and orders this month, and the products that need a restock.",
    pattern: "dashboard.md",
    states: [],
    components: (["ConsoleShell", "PageHeader", "TimeRangeControl", "Stat", "DashboardGrid", "Chart", "Meter", "BarGauge", "Table", "Badge", "Link"] as const).map(component),
    files: [react("dashboard.tsx", dashboard), ...app, rust("dashboard")],
  },
  {
    id: "crud",
    label: "Products",
    description: "List, open, create and edit products. Every screen keeps its title in place.",
    pattern: "crud.md",
    states: ["List", "Empty list", "Edit", "Edit with changes", "Create", "Detail"],
    components: (["ConsoleShell", "ListPage", "FormPage", "DetailPage", "Search", "Table", "StatusBadge", "FormField", "KV", "Link"] as const).map(component),
    files: [react("crud.tsx", crud), ...app, rust("crud")],
  },
  {
    id: "charts",
    label: "Charts",
    description: "Sales and stock trends for a time range, and a map of the shop systems.",
    pattern: "report.md",
    states: [],
    components: (["ConsoleShell", "PageHeader", "TimeRangeControl", "DashboardGrid", "Chart", "BarGauge", "Meter", "Sparkline", "Diagram"] as const).map(component),
    files: [react("charts.tsx", charts), ...app, rust("charts")],
  },
  {
    id: "reports",
    label: "Reports",
    description: "The monthly reports of the shop. Each row opens one to read or print.",
    pattern: "report.md",
    states: [],
    components: (["ConsoleShell", "PageHeader", "Table", "Link"] as const).map(component),
    files: [react("reports.tsx", reports), ...app],
  },
  {
    id: "report",
    label: "Monthly report",
    description: "A report read in order and printed. Print it to see the paper layout.",
    pattern: "report.md",
    states: [],
    components: (["ConsoleShell", "PageHeader", "Button", "Card", "Stat", "Disclosure", "DashboardGrid", "Chart", "Meter", "Table", "Badge"] as const).map(component),
    files: [react("report.tsx", report), ...app],
  },
  {
    id: "landing",
    label: "Landing page",
    description: "The Kiso introduction: a compact hero with an interface in perspective, live component examples in the opposite theme and a closing call to action.",
    pattern: "page-layout.md",
    webOnly: true,
    states: [],
    components: (["Card", "Badge", "Button", "FormField", "Input", "Table", "Meter", "Switch", "Steps"] as const).map(component),
    files: [react("intro.tsx", landing, "apps/kiso-gallery/src/"), react("hero-panels.tsx", heroPanels, "apps/kiso-gallery/src/"), react("foundation-lab.tsx", foundationLab, "apps/kiso-gallery/src/"), react("component-orbit.tsx", componentOrbit, "apps/kiso-gallery/src/"), react("shell-assembly.tsx", shellAssembly, "apps/kiso-gallery/src/"), { name: "landing.css", path: "apps/kiso-gallery/src/landing.css", language: "css", code: landingCss }],
  },
] as const;

export type Template = (typeof templates)[number];
