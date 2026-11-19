import { useState } from "react";
import { Button, EmptyState, EmptyStateTitle, ListPage } from "@momoi-labs/kiso-react";

type Page = { rows: string[] };

export function ClustersList() {
  const [page] = useState<Page>({ rows: [] });
  // <PageHeaderDescription> in a comment is not a finding
  return (
    <ListPage title="Clusters" action={{ label: "Create cluster", href: "/clusters/new" }} state={page.rows.length ? "ready" : "empty"}>
      <div className="page-body">
        <Button disabled>Export</Button>
        <EmptyState>
          <EmptyStateTitle>No clusters yet</EmptyStateTitle>
        </EmptyState>
      </div>
    </ListPage>
  );
}
