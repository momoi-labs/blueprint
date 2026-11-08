"use client";

import * as React from "react";
import { clsx as cn } from "clsx";
import { Card } from "./card.js";

export type SiteSectionTone = "default" | "inverse" | "accent";
export type SiteSectionSize = "sm" | "md" | "lg" | "half" | "full";
export type SiteSectionLayout = "stack" | "center" | "split" | "row" | "grid";

type SiteSectionContext = { variant: "band" | "inset" };
const Context = React.createContext<SiteSectionContext>({ variant: "band" });

/* A full-width band of a site page. Its tone recolors everything inside. */
function SiteSection({ className, tone = "default", size = "md", variant = "band", glow, ...props }:
  React.ComponentProps<"section"> & {
    tone?: SiteSectionTone; size?: SiteSectionSize; variant?: "band" | "inset";
    /** A soft light in the primary color, from the top, the start or the end. */
    glow?: "top" | "start" | "end";
  }) {
  return (
    <Context.Provider value={{ variant }}>
      <section data-slot="site-section" data-tone={tone} data-size={size} data-variant={variant} data-glow={glow}
        className={cn("site-section", className)} {...props} />
    </Context.Provider>
  );
}

function SiteSectionHead({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="site-section-head" className={cn("site-section-head", className)} {...props} />;
}

/* The body lays its children out; an inset section frames them in a panel. */
function SiteSectionBody({ className, layout = "stack", columns, ratio, children, style, ...props }:
  React.ComponentProps<"div"> & { layout?: SiteSectionLayout; columns?: 2 | 3 | 4; ratio?: "1:1" | "1:2" | "2:1" }) {
  const { variant } = React.useContext(Context);
  const content = <div className="site-section-content">{children}</div>;
  return (
    <div data-slot="site-section-body" data-layout={layout} data-ratio={layout === "split" ? ratio : undefined} className={cn("site-section-body", className)}
      style={columns ? { "--site-section-columns": columns, ...style } as React.CSSProperties : style} {...props}>
      <div className="site-section-inner">
        {variant === "inset" ? <Card className="site-section-panel">{content}</Card> : content}
      </div>
    </div>
  );
}

function SiteSectionFoot({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="site-section-foot" className={cn("site-section-foot", className)} {...props}>
      <div className="site-section-inner">{children}</div>
    </div>
  );
}

export { SiteSection, SiteSectionHead, SiteSectionBody, SiteSectionFoot };
