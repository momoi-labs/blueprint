import * as React from "react";
import { clsx as cn } from "clsx";

/* Facts as a list: a short lead in the foreground, then its detail. */
function FeatureList({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="feature-list" className={cn("feature-list", className)} {...props} />;
}

function FeatureListItem({ className, title, children, ...props }: Omit<React.ComponentProps<"li">, "title"> & { title?: React.ReactNode }) {
  return (
    <li data-slot="feature-list-item" className={cn(className)} {...props}>
      {title != null && <span className="feature-list-title">{title}</span>}{title != null && children != null && " "}{children}
    </li>
  );
}

export { FeatureList, FeatureListItem };
