import * as React from "react";
import { clsx as cn } from "clsx";
import { Card } from "./card.js";

/* Window chrome around an example: a screen, a terminal session or a page. */
function WindowFrame({ className, title, caption, variant = "app", children, ...props }:
  Omit<React.ComponentProps<"figure">, "title"> & { title?: React.ReactNode; caption?: React.ReactNode; variant?: "app" | "terminal" }) {
  return (
    <figure data-slot="window-frame" data-variant={variant} className={cn("window-frame", className)} {...props}>
      <Card>
        <div className="window-frame-bar">
          <span className="window-frame-dots" aria-hidden="true"><i /><i /><i /></span>
          {title != null && <span className="window-frame-title">{title}</span>}
        </div>
        <div className="window-frame-body">{children}</div>
      </Card>
      {caption != null && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export { WindowFrame };
