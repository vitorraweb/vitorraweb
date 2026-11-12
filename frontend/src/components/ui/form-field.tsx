"use client";

import { cloneElement, isValidElement, useId } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* One labelled field for the public forms (enquiry, contact). The label is
   tied to its input (htmlFor/id), so tapping the label focuses the field and
   screen readers announce the field by name; the error or hint is read out
   with it (aria-describedby). Choice groups (pill buttons) pass through
   untouched: they carry their own labelling. */

const CONTROLS = new Set<unknown>([Input, Textarea, "input", "select", "textarea"]);

export function FormField({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  const autoId = useId();
  const msgId = `${autoId}-msg`;
  const message = error || help;

  let control: React.ReactNode = children;
  let controlId: string | undefined;
  if (isValidElement<Record<string, unknown>>(children) && CONTROLS.has(children.type)) {
    controlId = (children.props.id as string | undefined) ?? autoId;
    control = cloneElement(children, {
      id: controlId,
      "aria-required": required || undefined,
      "aria-describedby": message ? msgId : undefined,
    });
  }

  return (
    <div>
      <Label htmlFor={controlId} className="mb-2 t-label text-ink-muted">
        {label}
        {required && <span aria-hidden="true" className="text-gold-ink"> *</span>}
      </Label>
      {control}
      {help && !error && <p id={msgId} className="mt-2 t-small text-gold-ink">{help}</p>}
      {error && <p id={msgId} role="alert" className="mt-2 t-small text-alert-ink">{error}</p>}
    </div>
  );
}
