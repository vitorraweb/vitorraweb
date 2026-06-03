"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, apiAdmin } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Both fields are required."); return; }
    setError(""); setLoading(true);
    try {
      const res = await apiAdmin<{ data: { token: string; user: { id: number; name: string; email: string; role: string } } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      );
      auth.save(res.data.token, res.data.user);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F2F2F2" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="Vitorra Holdings" width={72} height={72} className="mb-4" />
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#1E1E1E" }}>
            Admin Sign In
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#777777" }}>Vitorra Holdings — internal use only</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-[24px] p-7 border border-black/[0.06] shadow-card space-y-5">
          <div>
            <Label className="mb-2" style={{ color: "#1E1E1E" }}>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@vitorra.org" className="h-11 rounded-xl px-3.5" required />
          </div>
          <div>
            <Label className="mb-2" style={{ color: "#1E1E1E" }}>Password</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl px-3.5 pr-10" required />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
