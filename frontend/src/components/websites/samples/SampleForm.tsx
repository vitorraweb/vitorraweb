"use client";

import { useState } from "react";
import s from "./sample.module.css";

/* An enquiry or booking form on a sample site. It sends nothing: on submit it
   shows what the business would receive. Fields are declared by each sample. */

export type SampleField =
  | { name: string; label: string; type?: "text" | "email" | "tel" | "date" | "number"; half?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: string[]; half?: boolean }
  | { name: string; label: string; type: "textarea"; placeholder?: string };

export function SampleForm({ fields, submit, business }: { fields: SampleField[]; submit: string; business: string }) {
  const [sent, setSent] = useState<string | null>(null);

  if (sent !== null) {
    return (
      <div className={s.done} role="status">
        <strong>Thank you{sent ? `, ${sent}` : ""}.</strong>
        This is a sample form, so nothing was sent. On a real site, {business} would get your details by email and WhatsApp
        straight away, and the enquiry would wait in their inbox until they reply.
      </div>
    );
  }

  // Pair "half" fields into two-column rows.
  const rows: SampleField[][] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if ("half" in f && f.half && last && last.length === 1 && "half" in last[0] && last[0].half) last.push(f);
    else rows.push([f]);
  }

  return (
    <form
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const name = String(new FormData(e.currentTarget).get("name") ?? "").trim().split(" ")[0];
        setSent(name);
      }}
    >
      {rows.map((row) => (
        <div key={row.map((f) => f.name).join("-")} className={row.length > 1 ? s.row : undefined}>
          {row.map((f) => (
            <label key={f.name} className={s.field}>
              <span>{f.label}</span>
              {f.type === "select" ? (
                <select name={f.name} defaultValue="">
                  <option value="" disabled>Choose…</option>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea name={f.name} placeholder={f.placeholder} />
              ) : (
                <input name={f.name} type={f.type ?? "text"} placeholder={"placeholder" in f ? f.placeholder : undefined} />
              )}
            </label>
          ))}
        </div>
      ))}
      <button type="submit" className={s.submit}>{submit}</button>
    </form>
  );
}
