import type { ReactNode } from "react";
import { Card, CardContent } from "./card.js";
import type { PageWidth } from "./form-page.js";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "./empty-state.js";
import { PageActionButton, type PageAction } from "./page-action.js";
import { PageHeader, PageHeaderTitle } from "./page-header.js";
import { Skeleton } from "./skeleton.js";
import { Table, TableFrame } from "./table.js";

type ListPageProps = {
  title: string;
  action: PageAction;
  state: "loading" | "empty" | "ready";
  empty: { title: string; text?: string };
  filters?: ReactNode;
  count?: string;
  fill?: boolean;
  width?: PageWidth;
  children: ReactNode;
};

function ListPage({ title, action, state, empty, filters, count, fill = false, width = "full", children }: ListPageProps) {
  return <>
    <PageHeader actions={<PageActionButton action={action} />}>
      <PageHeaderTitle>{title}</PageHeaderTitle>
    </PageHeader>
    {state === "empty"
      ? <Card data-width={width}>
        <CardContent>
          <EmptyState>
            <EmptyStateTitle>{empty.title}</EmptyStateTitle>
            {empty.text ? <EmptyStateDescription>{empty.text}</EmptyStateDescription> : null}
          </EmptyState>
        </CardContent>
      </Card>
      : <>
        {state === "ready" && filters ? <div data-width={width}>{filters}</div> : null}
        <TableFrame data-fill={fill ? undefined : "false"} data-width={width}>
          <Table>{state === "loading" ? <tbody><tr><td><Skeleton /></td></tr></tbody> : children}</Table>
          {state === "ready" && count ? <div className="table-footer"><span>{count}</span></div> : null}
        </TableFrame>
      </>}
  </>;
}

export { ListPage };
export type { ListPageProps, PageAction };
