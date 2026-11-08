import * as React from "react";
import { clsx as cn } from "clsx";
import { Card } from "./card.js";

/* Short facts in joined cells. The cells wrap when the grid narrows. */
function FeatureGrid({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <Card data-slot="feature-grid" className={cn("feature-grid", className)} {...props}>
      <div className="feature-grid-cells" role="list">{children}</div>
    </Card>
  );
}

function FeatureGridItem({ className, title, titleAs: Title = "h3", children, ...props }:
  Omit<React.ComponentProps<"div">, "title"> & { title: React.ReactNode; titleAs?: "h2" | "h3" | "h4" | "p" }) {
  return (
    <div data-slot="feature-grid-item" role="listitem" className={cn("feature-grid-item", className)} {...props}>
      <Title className="feature-grid-title">{title}</Title>
      {children != null && <div className="feature-grid-description">{children}</div>}
    </div>
  );
}

export { FeatureGrid, FeatureGridItem };
