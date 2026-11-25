"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import s from "./sample.module.css";

/* A button on a sample site that would contact the business. Samples have no
   real number, so instead of opening WhatsApp it shows the message a customer
   would send, and says what happens on a real site. */

export function SampleAction({
  message,
  className,
  children,
  label = "Your customer's WhatsApp",
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      {open && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-label={label}>
          <button type="button" className={s.scrim} aria-label="Close" onClick={() => setOpen(false)} />
          <div className={s.dialog}>
            <div className={s.dialogHead}>
              <span>{label}</span>
              <button type="button" className={s.close} onClick={() => setOpen(false)} aria-label="Close" autoFocus><X size={18} /></button>
            </div>
            <div className={s.thread}><p className={s.bubble}>{message}</p></div>
            <p className={s.note}>
              This is a sample site. On a real one, this button opens WhatsApp with the message already written.
              The customer presses send, and it arrives on the business&apos;s phone.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
