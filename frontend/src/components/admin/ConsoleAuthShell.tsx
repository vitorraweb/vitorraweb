"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff } from "lucide-react";

/* ─── Console sign-in frame ───────────────────────────────────────────────────
   Sign in, forgot password and reset password wear the console's own clothes
   (lib/admin-apps + the c- primitives in globals.css): the same top bar, flat
   squared panel, compact fields and ink button, so signing in feels like the
   first screen of the tool rather than a different site.                    */

export function ConsoleAuthShell({ title, subtitle, children, footnote }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="admin-console min-h-screen flex flex-col bg-paper-deep text-ink-soft">
      <header className="bg-paper border-b border-line">
        <div className="flex items-center h-12 px-3 sm:px-4">
          <span className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={20} height={20} />
            <span className="font-serif text-[17px] leading-none text-ink">Vitorra</span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Console</span>
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink">
            Open the website <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Vitorra Holdings Limited" width={72} height={72} priority />
          </div>
          <section className="c-panel">
            <div className="px-6 pt-6 pb-1">
              <h1 className="c-title">{title}</h1>
              {subtitle && <p className="c-subtitle">{subtitle}</p>}
            </div>
            <div className="px-6 pt-4 pb-6">{children}</div>
          </section>
          {footnote && <div className="mt-4 text-center text-[12.5px] text-ink-muted">{footnote}</div>}
        </div>
      </main>

      <footer className="px-4 py-4 text-center text-[11.5px] text-ink-muted">
        Vitorra Holdings Limited · Internal use only. Sessions end automatically for security.
      </footer>
    </div>
  );
}

export function AuthField({ label, aside, hint, children }: { label: string; aside?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-medium text-ink">{label}</span>
        {aside}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] text-ink-muted mt-1">{hint}</span>}
    </label>
  );
}

/** Password input with a show / hide toggle. */
export function PasswordInput({ value, onChange, autoComplete, autoFocus, show, onToggle }: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
  show?: boolean;
  onToggle?: () => void;
}) {
  const [own, setOwn] = useState(false);
  const visible = show ?? own;
  return (
    <span className="relative block">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        className="c-input w-full !h-10 pr-10"
      />
      <button
        type="button"
        onClick={() => (onToggle ? onToggle() : setOwn((s) => !s))}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 -translate-y-1/2 c-icon-btn !w-8 !h-8"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </span>
  );
}

export function AuthNotice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: React.ReactNode }) {
  const cls = tone === "error"
    ? "border-[#E8CACA] bg-[#FBF4F4] text-alert-ink"
    : tone === "ok"
      ? "border-[#C9DECB] bg-[#F3F8F3] text-ok-ink"
      : "border-[color-mix(in_oklab,var(--color-gold)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-gold)_9%,var(--color-paper))] text-gold-ink";
  return <div role={tone === "error" ? "alert" : "status"} className={`border rounded-edge px-3 py-2 text-[12.5px] leading-snug ${cls}`}>{children}</div>;
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="text-[12.5px] text-gold-ink hover:underline">{children}</Link>;
}
