import * as React from "react";
import { clsx as cn } from "clsx";

/* The page's last line: a start, such as the copyright, and an end, such as links. */
function SiteFooter({ className, start, children, ...props }: React.ComponentProps<"footer"> & { start?: React.ReactNode }) {
  return (
    <footer data-slot="site-footer" className={cn("site-footer", className)} {...props}>
      <div className="site-footer-inner">
        <div className="site-footer-start">{start}</div>
        {children != null && <div className="site-footer-end">{children}</div>}
      </div>
    </footer>
  );
}

export { SiteFooter };
