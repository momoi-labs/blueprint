import type { ReactNode } from "react";
import { FileText, Folder, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import {
  ApplicationShell,
  Badge,
  BrandMark,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@momoi-labs/kiso-react";

/* The application shell the CRUD, Dashboard and Reports templates share:
   brand, navigation, account and a breadcrumb header. */
function LayoutIcon({ name }: { name: string }) {
  const icons: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    projects: Folder,
    team: Users,
    reports: FileText,
    settings: Settings,
  };
  const Icon = icons[name];
  return <Icon className="icon icon-sm" aria-hidden="true" />;
}

export function WorkspacePreview({
  page,
  parent,
  children,
}: {
  page: string;
  parent?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  const destination = (label: string, icon: string) => ({
    href: `#example/${icon}`,
    label,
    active: (parent?.label ?? page) === label,
    leading: <LayoutIcon name={icon} />,
    // A static preview: the links show where a page would go.
    onClick: () => {},
  });
  return (
    <ApplicationShell
      className="layout-shell"
      // A preview of a whole application: it draws the chosen background
      // itself, as it does when it is the page in the phone preview.
      data-background-canvas=""
      phoneNavigation="bottom"
      navigationLabel="Example workspace"
      brand={
        <div className="brand">
          <BrandMark>N</BrandMark>
          <div>
            <p className="t-label">Northstar</p>
            <p className="muted t-label">Team workspace</p>
          </div>
        </div>
      }
      navigation={[
        { label: "Workspace", destinations: [
          destination("Overview", "dashboard"),
          destination("Projects", "projects"),
          destination("Team", "team"),
          destination("Reports", "reports"),
        ] },
        { label: "Manage", destinations: [
          destination("Settings", "settings"),
          destination("Help & resources", "reports"),
        ] },
      ]}
      footer={
        <div className="layout-account">
          <BrandMark>A</BrandMark>
          <div>
            <p className="t-label">Alex Morgan</p>
            <p className="muted t-label">Personal account</p>
          </div>
        </div>
      }
      header={<>
        <Breadcrumb aria-label="Example location">
          <BreadcrumbList>
            <BreadcrumbItem>Workspace</BreadcrumbItem>
            <BreadcrumbSeparator />
            {parent && <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`#${parent.label}`} onClick={event => { event.preventDefault(); parent.onClick(); }}>{parent.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>}
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="row">
          <Badge variant="neutral">Pro plan</Badge>
          <Button
            variant="ghost"
            size="sm"
            className="btn-icon"
            aria-label="Example notifications"
          >
            <span aria-hidden="true">◇</span>
          </Button>
        </div>
      </>}
    >
      <div className="layout-content">{children}</div>
    </ApplicationShell>
  );
}
