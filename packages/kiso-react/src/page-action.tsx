import type { ReactNode } from "react";
import { Button } from "./button.js";

type PageAction = { label: string; icon?: ReactNode; onClick?: () => void; href?: string };

function PageActionButton({ action }: { action: PageAction }) {
  const content = <>{action.icon}{action.label}</>;
  return action.href
    ? <Button size="sm" variant="primary" asChild><a href={action.href}>{content}</a></Button>
    : <Button size="sm" variant="primary" onClick={action.onClick}>{content}</Button>;
}

export { PageActionButton };
export type { PageAction };
