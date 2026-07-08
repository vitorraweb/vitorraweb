"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Plug } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { ONLINE_PAYMENTS_ENABLED } from "@/lib/config";
import { PageHeader } from "@/components/admin/admin-ui";

type Health = {
  provider: string;
  driver: string;
  online_enabled: boolean;
  keys_present: boolean;
  environment: string;
  webhook_secret_set: boolean;
};

export default function PaymentsHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    apiAdmin<{ data: Health }>("/admin/payments/health")
      .then((res) => setHealth(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const runTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await apiAdmin<{ data: { ok: boolean; message: string } }>("/admin/payments/health/test", { method: "POST" });
      setTestResult(res.data);
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (error) return <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>;
  if (!health) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  // Everything that must be true for customers to actually pay online.
  const checks = [
    { ok: health.online_enabled, label: "Online payments switched on", detail: health.online_enabled ? "The gateway is set to Flutterwave." : `Currently “${health.driver}” — orders are confirmed offline. Set PAYMENT_DRIVER=flutterwave.` },
    { ok: health.keys_present, label: "Flutterwave account connected", detail: health.keys_present ? "API keys are configured." : "Add FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY." },
    { ok: health.webhook_secret_set, label: "Payment notifications configured", detail: health.webhook_secret_set ? "Flutterwave can notify us when a payment completes." : "Generate a webhook secret hash in the Flutterwave dashboard (Settings → Webhooks) and set FLUTTERWAVE_SECRET_HASH." },
    { ok: ONLINE_PAYMENTS_ENABLED, label: "Pay buttons shown to customers", detail: ONLINE_PAYMENTS_ENABLED ? "The website is offering online payment." : "Set NEXT_PUBLIC_ONLINE_PAYMENTS=true on the website." },
  ];
  const live = checks.every((c) => c.ok);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Payments" subtitle="Whether customers can pay online (card + MTN/Airtel mobile money via Flutterwave)." />

      {/* Headline verdict */}
      <div className="rounded-2xl p-5 mb-6 flex items-start gap-3" style={live
        ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)" }
        : { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)" }}>
        {live ? <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "#16A34A" }} /> : <AlertTriangle className="w-6 h-6 shrink-0" style={{ color: "#B45309" }} />}
        <div>
          <p className="font-bold" style={{ color: live ? "#15803D" : "#92400E" }}>
            {live ? "Online payments are LIVE" : "Online payments are not live yet"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#555" }}>
            {live
              ? `Customers can pay online now (${health.environment === "live" ? "live" : "sandbox / testing"} mode).`
              : "Customers currently can't pay online — see the steps below."}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-black/[0.06] divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-3 p-4">
            {c.ok
              ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
              : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D97706" }} />}
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{c.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#777" }}>{c.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mode + live connection test */}
      <div className="mt-6 bg-white rounded-2xl border border-black/[0.06] p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>Connection test</p>
            <p className="text-xs mt-0.5" style={{ color: "#777" }}>
              Mode: <strong style={{ color: "#1E1E1E" }}>{health.environment === "live" ? "Live" : "Sandbox (testing)"}</strong> · runs a real test payment request and reports exactly what Flutterwave says (the test link is never charged).
            </p>
          </div>
          <button
            type="button"
            onClick={runTest}
            disabled={testing || !health.keys_present}
            className="btn-secondary"
            style={{ opacity: testing || !health.keys_present ? 0.6 : 1 }}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Test connection
          </button>
        </div>
        {testResult && (
          <div className="mt-4 rounded-xl p-3.5 flex items-start gap-2.5 text-sm" style={testResult.ok
            ? { background: "rgba(34,197,94,0.1)", color: "#15803D" }
            : { background: "rgba(192,57,43,0.08)", color: "#B91C1C" }}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
