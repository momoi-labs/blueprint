import { useState, type ReactNode } from "react";
import { ChartLine, FileText, LayoutDashboard, Package, type LucideIcon } from "lucide-react";
import {
  Badge,
  ConsoleShell,
  Dot,
  type ConsoleCrumb,
} from "@momoi-labs/kiso-react";
import { ShopMark } from "./shop-mark";
import { ChartsLayout } from "./charts";
import { ProductScreens, consoleLayouts, consoleScreens, crudPath, defaultLayout, readTab, type ConsoleScreen, type DetailTab } from "./crud";
import { DashboardLayout } from "./dashboard";
import { LoginLayout, loginResults, type LoginResult } from "./login";
import { ReportLayout } from "./report";
import { ReportsLayout } from "./reports";
import { products as catalog, reports, shopHref, stockState, type Product } from "./shop-data";

export const shopName = "Tabi & Smoke";

export const shopPages = [
  ["login", "Login"],
  ["dashboard", "Overview"],
  ["crud", "Products"],
  ["charts", "Charts"],
  ["reports", "Reports"],
  ["report", "Monthly report"],
] as const;
export type ShopPage = (typeof shopPages)[number][0];

export function readShopPath(path: string) {
  const [first, second, third, fourth] = path.split("/");
  const screen: ConsoleScreen = consoleScreens.find(([key]) => key === second)?.[0] ?? "list";
  const chosen = consoleLayouts.find(value => value === third && value !== defaultLayout(screen));
  return {
    page: (shopPages.find(([id]) => id === first)?.[0] ?? "login") as ShopPage,
    result: (loginResults.find(([value]) => value === second)?.[0] ?? "success") as LoginResult,
    screen,
    chosen,
    layout: chosen ?? defaultLayout(screen),
    tab: readTab(fourth),
    report: reports.find(report => report.id === second) ?? reports[0],
  };
}

export function ShopApp({ path, onNavigate, theme, onThemeChange }: {
  path: string;
  onNavigate: (path: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}) {
  const [products, setProducts] = useState(catalog);
  const [selected, setSelected] = useState(catalog[0].sku);
  const at = readShopPath(path);
  if (at.page === "login") return <LoginLayout key={at.result} result={at.result} onSignedIn={() => onNavigate("dashboard")} />;

  const product = products.find(item => item.sku === selected) ?? catalog[0];
  const crud = (screen: ConsoleScreen, tab?: DetailTab) => crudPath(screen, at.chosen, tab);
  const open = (sku: string) => { setSelected(sku); onNavigate(crud("detail")); };
  const create = (next: Product) => { setProducts(current => [next, ...current]); open(next.sku); };
  const save = (sku: string, next: Product) => setProducts(current => current.map(item => item.sku === sku ? next : item));

  const destination = (to: string, label: string, Icon: LucideIcon, active: boolean, trailing?: ReactNode) => ({
    href: shopHref(to),
    label,
    active,
    leading: <Icon className="icon icon-sm" aria-hidden="true" />,
    trailing,
    onClick: () => onNavigate(to),
  });
  const crumb = (to: string, label: string): ConsoleCrumb =>
    ({ label, href: shopHref(to), onClick: event => { event.preventDefault(); onNavigate(to); } });
  const productCrumbs: Record<ConsoleScreen, ConsoleCrumb[]> = {
    list: [{ label: "Products" }],
    empty: [{ label: "Products" }],
    create: [crumb(crud("list"), "Products"), { label: "New product" }],
    detail: [crumb(crud("list"), "Products"), { label: product.name }],
    edit: [crumb(crud("list"), "Products"), crumb(crud("detail"), product.name), { label: "Edit" }],
    "edit-dirty": [crumb(crud("list"), "Products"), crumb(crud("detail"), product.name), { label: "Edit" }],
  };
  const crumbs: Record<Exclude<ShopPage, "login">, ConsoleCrumb[]> = {
    dashboard: [{ label: "Overview" }],
    crud: productCrumbs[at.screen],
    charts: [{ label: "Charts" }],
    reports: [{ label: "Reports" }],
    report: [crumb("reports", "Reports"), { label: at.report.month }],
  };
  const restock = products.some(item => stockState(item) !== "In stock");

  return (
    <ConsoleShell
      navigationLabel={`${shopName} back office`}
      brandMark={<ShopMark />}
      brand={
        <div className="brand">
          <ShopMark />
          <div>
            <p className="t-label">{shopName}</p>
            <p className="muted t-label">Ninja supply, back office</p>
          </div>
        </div>
      }
      navigation={[
        { label: "Shop", destinations: [
          destination("dashboard", "Overview", LayoutDashboard, at.page === "dashboard"),
          destination(crud("list"), "Products", Package, at.page === "crud", restock ? <Dot variant="warning" /> : undefined),
        ] },
        { label: "Insights", destinations: [
          destination("charts", "Charts", ChartLine, at.page === "charts"),
          destination("reports", "Reports", FileText, at.page === "reports" || at.page === "report"),
        ] },
      ]}
      breadcrumb={[{ label: "Back office" }, ...crumbs[at.page]]}
      status={<Badge variant="neutral">Shop open</Badge>}
      account={{
        identity: "Aki Morino",
        theme,
        onThemeChange,
        onSignOut: () => onNavigate("login"),
      }}
    >
      {at.page === "dashboard" ? <DashboardLayout products={products} go={onNavigate} open={open} />
        : at.page === "charts" ? <ChartsLayout />
        : at.page === "reports" ? <ReportsLayout go={onNavigate} />
        : at.page === "report" ? <ReportLayout report={at.report} products={products} />
        : <ProductScreens screen={at.screen} layout={at.layout} tab={at.tab} products={products} product={product}
            go={(screen, tab) => onNavigate(crud(screen, tab))} open={open} onCreate={create} onSave={save} />}
    </ConsoleShell>
  );
}
