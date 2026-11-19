import type { ReactNode } from "react";
import { Card } from "./card.js";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "./empty-state.js";
import type { PageWidth } from "./form-page.js";
import { PageActionButton, type PageAction } from "./page-action.js";
import { PageHeader, PageHeaderTitle } from "./page-header.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.js";

type DetailTab = {
  value: string;
  label: string;
  empty?: { title: string; text?: string };
  content?: ReactNode;
};

type DetailPageProps = {
  title: string;
  action?: PageAction;
  tabs: readonly DetailTab[];
  tabsLabel?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  fill?: boolean;
  width?: PageWidth;
};

function DetailPage({ title, action, tabs, tabsLabel = `${title} details`, value, onValueChange, fill = false, width = "full" }: DetailPageProps) {
  return <>
    <PageHeader actions={action ? <PageActionButton action={action} /> : undefined}>
      <PageHeaderTitle>{title}</PageHeaderTitle>
    </PageHeader>
    <Card className="detail-tabs" data-fill={fill ? undefined : "false"} data-width={width}>
      <Tabs defaultValue={tabs[0]?.value} value={value} onValueChange={onValueChange}>
        <TabsList aria-label={tabsLabel}>
          {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
        </TabsList>
        {tabs.map(tab => <TabsContent key={tab.value} value={tab.value}>
          {tab.empty
            ? <EmptyState>
              <EmptyStateTitle>{tab.empty.title}</EmptyStateTitle>
              {tab.empty.text ? <EmptyStateDescription>{tab.empty.text}</EmptyStateDescription> : null}
            </EmptyState>
            : tab.content}
        </TabsContent>)}
      </Tabs>
    </Card>
  </>;
}

export { DetailPage };
export type { DetailPageProps, DetailTab };
