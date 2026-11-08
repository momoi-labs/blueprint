import * as React from "react";
import { clsx as cn } from "clsx";

/* An eyebrow, a title and a description, with optional actions. */
function SiteHeading({ className, eyebrow, title, description, actions, level = 2, size = "section", align = "start", ...props }:
  Omit<React.ComponentProps<"div">, "title"> & {
    eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode;
    level?: 1 | 2 | 3; size?: "display" | "section"; align?: "start" | "center";
  }) {
  const Title = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div data-slot="site-heading" data-size={size} data-align={align} className={cn("site-heading", className)} {...props}>
      {eyebrow != null && <p className="site-heading-eyebrow">{eyebrow}</p>}
      <Title className="site-heading-title">{title}</Title>
      {description != null && <p className="site-heading-description">{description}</p>}
      {actions != null && <div className="site-heading-actions">{actions}</div>}
    </div>
  );
}

export { SiteHeading };
