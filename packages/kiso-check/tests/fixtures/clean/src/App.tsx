import { ConsoleShell } from "@momoi-labs/kiso-react";
import { ClustersList } from "./ClustersList";

export function App() {
  return (
    <ConsoleShell brand={<span>Yard</span>} navigation={[]} breadcrumb={[{ label: "Clusters" }]}>
      <ClustersList />
    </ConsoleShell>
  );
}
