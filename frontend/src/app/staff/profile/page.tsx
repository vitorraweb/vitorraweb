"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, ShieldCheck, Eye, EyeOff, Clock } from "lucide-react";
import { staffAuth, apiStaff } from "@/lib/staff-auth";
import type { StaffUser } from "@/lib/staff-auth";
import { TwoFactorPanel } from "@/components/TwoFactorPanel";
import { SessionsPanel } from "@/components/SessionsPanel";

export default function StaffProfilePage() {
  const [user, setUser]     = useState<StaffUser | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    setUser(staffAuth.getUser());
    setExpiry(staffAuth.getExpiry());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaved(false);
    if (next.length < 8) { setError("Your new password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("The new password and confirmation don't match."); return; }
    if (next === current) { setError("Your new password must be different from the current one."); return; }
    setSaving(true);
    try {
      await apiStaff("/auth/password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, password: next, password_confirmation: confirm }),
      });
      setSaved(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setSaving(false);
    }
  };

  const expiryLabel = expiry
    ? new Date(expiry).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-2xl pb-16">
      <h2 className="mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>Profile & security</h2>
      <p className="text-sm mb-6" style={{ color: "#999" }}>Your account and password.</p>

      {user && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold shrink-0" style={{ background: "#C5B27A", color: "#1E1E1E" }}>
              {user.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-base truncate" style={{ color: "#1E1E1E" }}>{user.name}</p>
              <p className="text-sm truncate" style={{ color: "#999" }}>{user.email}</p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 capitalize" style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}>
              {user.role}
            </span>
          </div>
          <p className="text-xs mt-4" style={{ color: "#aaa" }}>To change your name, role, or department, contact HR.</p>
        </div>
      )}

      {expiryLabel && (
        <div className="flex items-start gap-3 rounded-[20px] border border-black/[0.06] p-5 mb-5" style={{ background: "#FAFAF8" }}>
          <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>This session signs out automatically</p>
            <p className="text-xs mt-0.5" style={{ color: "#999" }}>For security, you&apos;ll be asked to sign in again on <strong style={{ color: "#7A6020" }}>{expiryLabel}</strong>.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-[20px] border border-black/[0.06] p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-4 h-4" style={{ color: "#C5B27A" }} />
          <h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Change password</h3>
        </div>
        <div className="space-y-4">
          <Field label="Current password"><PwInput value={current} onChange={setCurrent} show={show} autoComplete="current-password" /></Field>
          <Field label="New password" hint="At least 8 characters."><PwInput value={next} onChange={setNext} show={show} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><PwInput value={confirm} onChange={setConfirm} show={show} autoComplete="new-password" /></Field>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#777" }}>
            <input type="checkbox" checked={show} onChange={() => setShow((s) => !s)} className="w-3.5 h-3.5 rounded accent-[#C5B27A]" />
            Show passwords
          </label>
          <p className="text-xs" style={{ color: "#aaa" }}>Changing your password signs you out of any other devices.</p>

          {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving || !current || !next || !confirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ background: "#1E1E1E", color: "#fff" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Update password
            </button>
            {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#16A34A" }}><Check className="w-4 h-4" />Password updated</span>}
          </div>
        </div>
      </form>

      {/* Two-factor authentication */}
      <TwoFactorPanel api={apiStaff} />

      {/* Active sessions */}
      <SessionsPanel api={apiStaff} />
    </div>
  );
}

function PwInput({ value, onChange, show, autoComplete }: { value: string; onChange: (v: string) => void; show: boolean; autoComplete: string }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <input type={show || reveal ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
        className="w-full text-sm rounded-xl px-3.5 py-2.5 pr-10 border outline-none focus:border-[#C5B27A]"
        style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
      <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#bbb" }} tabIndex={-1}>
        {show || reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "#999" }}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs" style={{ color: "#aaa" }}>{hint}</p>}
    </div>
  );
}
