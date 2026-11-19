import { Button, EmptyState, EmptyStateActions, PageHeader, PageHeaderDescription, PageHeaderTitle } from "@momoi-labs/kiso-react";
import { ListPage } from "./ListPage";
import { Page } from "./Page";

export function Screen({ busy, action, wide }) {
  return (
    <div className={`page ${wide ? "wide" : ""}`}>
      <PageHeader
        actions={
          <Button variant="primary" disabled={busy}>
            Create
          </Button>
        }
      >
        <PageHeaderTitle>Clusters</PageHeaderTitle>
        <PageHeaderDescription>Every cluster in the project.</PageHeaderDescription>
      </PageHeader>
      <Page />
      <EmptyState>
        <Button>Create</Button>
      </EmptyState>
      <EmptyState>
        <EmptyStateActions>{action}</EmptyStateActions>
      </EmptyState>
      <ListPage title="Nodes" action={{ label: "Add node", disabled: true }} />
    </div>
  );
}
