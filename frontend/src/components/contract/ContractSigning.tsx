"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CheckCircle2, Download, Eraser, Loader2, PenLine, Type } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

/* ─── Contract signing (client side) ──────────────────────────────────────────
   Opened from the private link in the client's email. Shows the full contract,
   word for word as the PDF (both are built from the same server structure),
   then lets the client sign by drawing or typing, or decline with a reason.
   The link works once and expires after 48 hours; the server enforces both. */

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "rows"; rows: [string, string][]; footer?: string | null }
  | { type: "checks"; items: [boolean, string][] };

type Doc = {
  number: string; title: string; intro: string;
  seller: { company: string; address: string[]; rows: [string, string | null][] };
  buyer: [string, string][];
  sections: { no: number; title: string; blocks: Block[] }[];
};

type Data = { number: string; buyer_name: string; expires_at: string; document: Doc };

const serif = { fontFamily: "var(--font-display, Georgia, serif)" } as const;

export default function ContractSigning({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [gone, setGone] = useState("");
  const [done, setDone] = useState<{ kind: "signed"; email: string } | { kind: "declined" } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/contracts/sign/${token}`, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) { setGone(body.message ?? "This link is no longer active."); return; }
        setData(body.data);
      })
      .catch(() => setGone("We could not load your contract. Please check your connection and try again."));
  }, [token]);

  if (gone) {
    return (
      <Shell>
        <div className="border border-line bg-white p-8 text-center">
          <p className="text-xl text-ink mb-2" style={serif}>This link is no longer active</p>
          <p className="text-[15px] text-ink-soft">{gone}</p>
        </div>
      </Shell>
    );
  }
  if (done) {
    return (
      <Shell>
        <div className="border border-line bg-white p-8 text-center">
          <CheckCircle2 className={`w-10 h-10 mx-auto mb-3 ${done.kind === "signed" ? "text-ok-ink" : "text-ink-muted"}`} />
          <p className="text-2xl text-ink mb-2" style={serif}>{done.kind === "signed" ? "Thank you. Your contract is signed." : "We have let the team know."}</p>
          <p className="text-[15px] text-ink-soft">
            {done.kind === "signed"
              ? `A signed copy has been emailed to ${done.email}. Our team will be in touch about payment and installation.`
              : "Your Vitorra representative will contact you. You can also reply to the email we sent you."}
          </p>
        </div>
      </Shell>
    );
  }
  if (!data) {
    return <Shell><div className="flex items-center justify-center gap-2 py-24 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading your contract…</div></Shell>;
  }

  return (
    <Shell>
      <ContractBody data={data} token={token} />
      <SignPanel data={data} token={token} onDone={setDone} />
    </Shell>
  );
}

function ContractBody({ data, token }: { data: Data; token: string }) {
  const d = data.document;
  const expires = new Date(data.expires_at).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return (
    <article className="border border-line bg-white px-5 sm:px-10 py-8 sm:py-10 text-[14.5px] leading-relaxed text-ink-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6 text-[12.5px] text-ink-muted">
        <span>Contract {d.number} · for {data.buyer_name}</span>
        <a href={`${API_BASE_URL}/contracts/sign/${token}/pdf`} className="inline-flex items-center gap-1.5 text-ink underline decoration-gold underline-offset-4"><Download className="w-3.5 h-3.5" />Download PDF</a>
      </div>
      <p className="text-[12.5px] text-ink-muted mb-6">Please read the agreement, then sign at the bottom of the page. This private link expires on {expires} and can be used to sign once.</p>

      <h1 className="text-2xl sm:text-3xl text-ink text-center leading-snug mb-6" style={serif}>{d.title}</h1>
      <p className="mb-6">{d.intro}</p>

      <div className="grid sm:grid-cols-2 gap-6 border-y border-line py-5 mb-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gold-ink mb-2">Seller</p>
          <p className="text-ink font-medium">{d.seller.company}</p>
          {d.seller.address.map((l) => <p key={l}>{l}</p>)}
          {d.seller.rows.map(([k, v]) => <p key={k} className="mt-1">{k}: {v ?? "—"}</p>)}
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gold-ink mb-2">Buyer</p>
          {d.buyer.map(([k, v]) => <p key={k}><span className="text-ink-muted">{k}:</span> {v}</p>)}
        </div>
      </div>
      <p className="mb-2">The Seller and Buyer shall collectively be referred to as the &quot;Parties.&quot;</p>

      {d.sections.map((s) => (
        <section key={s.no} className="mt-7">
          <h2 className="text-[12.5px] font-semibold tracking-[0.12em] uppercase text-gold-ink mb-2">{s.no}. {s.title}</h2>
          {s.blocks.map((b, i) => <BlockView key={i} b={b} />)}
        </section>
      ))}
    </article>
  );
}

function BlockView({ b }: { b: Block }) {
  if (b.type === "p") return <p className="mb-2">{b.text}</p>;
  if (b.type === "ul") return <ul className="list-disc pl-5 mb-2 space-y-0.5">{b.items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
  if (b.type === "checks") {
    return <div className="mb-2 space-y-1">{b.items.map(([on, label], i) => (
      <p key={i} className="flex items-start gap-2"><span className={`mt-1 inline-block w-3.5 h-3.5 border shrink-0 ${on ? "bg-ink border-ink" : "border-line-strong"}`} aria-hidden />{label}<span className="sr-only">{on ? "(selected)" : "(not selected)"}</span></p>
    ))}</div>;
  }
  return (
    <div className="mb-3">
      <dl className="divide-y divide-line border-y border-line">
        {b.rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-1 sm:grid-cols-[40%_1fr] gap-x-4 py-2">
            <dt className="text-ink-muted text-[13px]">{k}</dt><dd className="text-ink whitespace-pre-line">{v}</dd>
          </div>
        ))}
      </dl>
      {b.footer && <p className="mt-2 font-semibold text-ink">{b.footer}</p>}
    </div>
  );
}

/* ── Signing ── */

function SignPanel({ data, token, onDone }: { data: Data; token: string; onDone: (d: { kind: "signed"; email: string } | { kind: "declined" }) => void }) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [typed, setTyped] = useState("");
  const [agree, setAgree] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const padRef = useRef<SignaturePadHandle>(null);

  const ready = name.trim() !== "" && agree && (mode === "draw" ? hasInk : typed.trim() !== "");

  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API_BASE_URL}/contracts/sign/${token}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message ?? "Something went wrong. Please try again.");
    return json;
  };

  const sign = async () => {
    if (!ready) return;
    setBusy(true); setError("");
    try {
      const signature = mode === "draw" ? padRef.current?.toDataUrl() : typed.trim();
      if (!signature) throw new Error("Please add your signature.");
      const r = await post("", { signer_name: name.trim(), signer_position: position.trim() || null, signature_type: mode === "draw" ? "drawn" : "typed", signature_data: signature, agree: true });
      onDone({ kind: "signed", email: r.data.email });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  const decline = async () => {
    setBusy(true); setError("");
    try { await post("/decline", { reason: reason.trim() || null }); onDone({ kind: "declined" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <section className="border border-line bg-white px-5 sm:px-10 py-8 mt-4" aria-labelledby="sign-heading">
      <h2 id="sign-heading" className="text-2xl text-ink mb-1" style={serif}>Sign the agreement</h2>
      <p className="text-[14px] text-ink-muted mb-6">Signing on behalf of {data.buyer_name}.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="block">
          <span className="block text-[12.5px] font-medium text-ink mb-1.5">Your full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full h-11 px-3 border border-line-strong bg-white text-ink text-[15px] focus:outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="block text-[12.5px] font-medium text-ink mb-1.5">Position <span className="text-ink-muted font-normal">(optional)</span></span>
          <input value={position} onChange={(e) => setPosition(e.target.value)} autoComplete="organization-title" className="w-full h-11 px-3 border border-line-strong bg-white text-ink text-[15px] focus:outline-none focus:border-ink" />
        </label>
      </div>

      <div className="flex gap-1 mb-2" role="tablist" aria-label="How to sign">
        {([["draw", "Draw", PenLine], ["type", "Type", Type]] as const).map(([m, label, Icon]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-[13.5px] border ${mode === m ? "border-ink bg-ink text-white" : "border-line-strong text-ink"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {mode === "draw" ? (
        <div className="mb-5">
          <SignaturePad ref={padRef} onInk={setHasInk} />
          <div className="flex justify-between mt-1.5 text-[12.5px] text-ink-muted">
            <span>Sign with your finger or mouse inside the box.</span>
            <button type="button" onClick={() => padRef.current?.clear()} className="inline-flex items-center gap-1 text-ink"><Eraser className="w-3.5 h-3.5" />Clear</button>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name as your signature" aria-label="Typed signature"
            className="w-full h-24 px-4 border border-line-strong bg-white text-ink text-3xl italic focus:outline-none focus:border-ink" style={serif} />
        </div>
      )}

      <label className="flex items-start gap-3 mb-6 text-[14.5px] text-ink cursor-pointer">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-4 h-4 shrink-0" />
        <span>I have read and agree to this Agreement, and I am authorised to sign it on behalf of {data.buyer_name}. I agree to sign it electronically.</span>
      </label>

      {error && <p className="text-[14px] text-alert-ink mb-4" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={sign} disabled={!ready || busy} className="inline-flex items-center gap-2 h-12 px-6 bg-ink text-white text-[15px] disabled:opacity-40">
          {busy && !declining ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}Sign the agreement
        </button>
        {!declining && <button onClick={() => setDeclining(true)} className="text-[14px] text-ink-muted underline underline-offset-4">I don&apos;t want to sign</button>}
      </div>

      {declining && (
        <div className="mt-6 border-t border-line pt-5">
          <label className="block">
            <span className="block text-[13px] font-medium text-ink mb-1.5">Tell us why, so we can help (optional)</span>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-line-strong bg-white text-ink text-[15px] focus:outline-none focus:border-ink" />
          </label>
          <div className="flex gap-3 mt-3">
            <button onClick={decline} disabled={busy} className="h-10 px-4 border border-ink text-ink text-[14px]">{busy ? "Sending…" : "Decline to sign"}</button>
            <button onClick={() => setDeclining(false)} disabled={busy} className="h-10 px-4 text-[14px] text-ink-muted">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

type SignaturePadHandle = { clear: () => void; toDataUrl: () => string | null };

/* A drawing surface for the signature. Pointer events cover mouse, pen and
   touch; touch-action: none keeps the page from scrolling while signing. */
function SignaturePadInner({ onInk }: { onInk: (v: boolean) => void }, ref: React.Ref<SignaturePadHandle>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);

  const setup = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1E1E1E";
    inked.current = false; onInk(false);
  }, [onInk]);

  useEffect(() => { setup(); }, [setup]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  useImperativeHandle(ref, () => ({
    clear: setup,
    toDataUrl: () => (inked.current && canvas.current ? canvas.current.toDataURL("image/png") : null),
  }), [setup]);

  return (
    <canvas
      ref={canvas}
      aria-label="Signature drawing area"
      className="w-full h-40 border border-line-strong bg-paper block"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        const ctx = e.currentTarget.getContext("2d")!;
        const [x, y] = point(e);
        ctx.beginPath(); ctx.moveTo(x, y);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const ctx = e.currentTarget.getContext("2d")!;
        const [x, y] = point(e);
        ctx.lineTo(x, y); ctx.stroke();
        if (!inked.current) { inked.current = true; onInk(true); }
      }}
      onPointerUp={() => { drawing.current = false; }}
      onPointerCancel={() => { drawing.current = false; }}
    />
  );
}

const SignaturePad = forwardRef(SignaturePadInner);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-paper-deep min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-14">
        <p className="text-[13px] tracking-[0.18em] uppercase text-ink mb-6" style={serif}>
          Vitorra <span className="text-gold-ink">Holdings</span>
        </p>
        {children}
      </div>
    </main>
  );
}
