import * as React from "react";
import { clsx as cn } from "clsx";
import { Button } from "./button.js";

// Controls are Buttons by default. For URL-addressable pages, pass asChild and
// render the product's link: <PaginationPage asChild><a href="?page=2" /></…>.
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      aria-label="Pagination"
      className={cn("pagination", className)}
      {...props}
    />
  );
}

function PaginationPrevious({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button data-slot="pagination-previous" size="sm" {...props}>
      {children ?? "Previous"}
    </Button>
  );
}

function PaginationNext({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button data-slot="pagination-next" size="sm" {...props}>
      {children ?? "Next"}
    </Button>
  );
}

function PaginationPage({
  active = false,
  ...props
}: React.ComponentProps<typeof Button> & { active?: boolean }) {
  return (
    <Button
      data-slot="pagination-page"
      size="sm"
      aria-current={active ? "page" : undefined}
      {...props}
    />
  );
}

function PaginationEllipsis({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn("muted", className)}
      {...props}
    >
      {children ?? "..."}
    </span>
  );
}

export {
  Pagination,
  PaginationPrevious,
  PaginationNext,
  PaginationPage,
  PaginationEllipsis,
};
