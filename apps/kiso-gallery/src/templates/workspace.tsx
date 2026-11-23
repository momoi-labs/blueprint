import type { ReactNode } from "react";
import { FileText, Folder, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import {
  Badge,
  BrandMark,
  Button,
  ConsoleShell,
  Dot,
} from "@momoi-labs/kiso-react";

/* The application shell the Dashboard and Charts templates share:
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
  theme,
  onThemeChange,
  children,
}: {
  page: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  children: ReactNode;
}) {
  const destination = (label: string, icon: string, trailing?: ReactNode) => ({
    href: `#example/${icon}`,
    label,
    active: page === label,
    leading: <LayoutIcon name={icon} />,
    trailing,
    // A static preview: the links show where a page would go.
    onClick: () => {},
  });
  return (
    <ConsoleShell
      navigationLabel="Example workspace"
      brandMark={<BrandMark>N</BrandMark>}
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
          destination("Overview", "dashboard", <Dot variant="warning" />),
          destination("Projects", "projects"),
          destination("Team", "team"),
          destination("Reports", "reports"),
        ] },
        { label: "Manage", destinations: [
          destination("Settings", "settings", <Dot variant="info" />),
          destination("Help & resources", "reports"),
        ] },
      ]}
      breadcrumb={[{ label: "Workspace" }, { label: page }]}
      status={<>
        <Badge variant="neutral">Pro plan</Badge>
        <Button
          variant="ghost"
          size="sm"
          className="btn-icon"
          aria-label="Example notifications"
        >
          <span aria-hidden="true">◇</span>
        </Button>
      </>}
      account={{
        identity: "Alex Morgan",
        theme,
        onThemeChange,
        onSignOut: () => {},
      }}
    >
      {children}
    </ConsoleShell>
  );
}
