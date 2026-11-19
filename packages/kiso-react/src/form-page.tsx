import type { FormEvent, ReactNode } from "react";
import { Button } from "./button.js";
import { Card } from "./card.js";
import { Form, FormActions } from "./form.js";
import { PageHeader, PageHeaderTitle } from "./page-header.js";

type PageWidth = "left" | "center" | "right" | "full";

type FormPageProps = {
  title: string;
  mode: "create" | "edit";
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  onDiscard?: () => void;
  dirty?: boolean;
  message?: ReactNode;
  failed?: boolean;
  width?: PageWidth;
  children: ReactNode;
};

function FormPage({ title, mode, submitLabel, onSubmit, onCancel, onDiscard, dirty = false, message, failed = false, width = "left", children }: FormPageProps) {
  const tone = failed ? "danger" : dirty ? "warning" : "neutral";
  return <>
    <PageHeader>
      <PageHeaderTitle>{title}</PageHeaderTitle>
    </PageHeader>
    <Card className="form-page" data-fill="false" data-width={width}>
      <Form onSubmit={onSubmit} aria-label={title}>
        <div className="form-body">{children}</div>
        <FormActions sticky tone={tone} message={message}>
          {mode === "create"
            ? <Button size="sm" type="button" onClick={onCancel}>Cancel</Button>
            : dirty ? <Button size="sm" type="button" onClick={onDiscard}>Discard</Button> : null}
          <Button size="sm" type="submit" variant="primary" disabled={mode === "edit" && !dirty}>{submitLabel}</Button>
        </FormActions>
      </Form>
    </Card>
  </>;
}

export { FormPage };
export type { FormPageProps, PageWidth };
