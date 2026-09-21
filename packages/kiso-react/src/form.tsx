import type { ComponentProps, ReactNode } from "react";
import { clsx } from "clsx";

type FormProps = ComponentProps<"form">;

function Form({ className, ...props }: FormProps) {
  return <form data-slot="form" className={clsx("form", className)} {...props} />;
}

type FormActionsProps = ComponentProps<"div"> & {
  sticky?: boolean;
  tone?: "neutral" | "warning" | "danger";
  message?: ReactNode;
};

function FormActions({
  className,
  sticky = false,
  tone = "neutral",
  message,
  children,
  ...props
}: FormActionsProps) {
  return (
    <div
      data-slot="form-actions"
      data-sticky={sticky || undefined}
      data-tone={tone}
      className={clsx("form-actions", className)}
      {...props}
    >
      <div className="form-actions-message" role="status" aria-atomic="true">
        {message}
      </div>
      <div className="form-actions-buttons">{children}</div>
    </div>
  );
}

export { Form, FormActions };
export type { FormProps, FormActionsProps };
