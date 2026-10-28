"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon, Type, Heading1, MousePointerClick, Minus, MoveVertical, Columns2, BadgeCheck,
  ArrowUp, ArrowDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  List, ListOrdered, Link2, Eraser, Monitor, Smartphone, Eye, Upload, Loader2, Settings2, X,
} from "lucide-react";
import { apiAdmin, uploadAdmin } from "@/lib/auth";

/* ─── Campaign designer ───────────────────────────────────────────────────────
   Block-based, like the big email tools: add a block from the left, click it
   on the canvas to edit (text is edited in place), and shape it on the right
   — colours, sizes, alignment, image width, backgrounds, spacing.

   The canvas is a close, live approximation. "Preview real email" asks the
   server for the actual HTML (App\Services\Marketing\EmailDesigner), which
   is exactly what tests and sends use. The server also cleans every value,
   so nothing typed here can break the email or reach a style unchecked.  */

export type Align = "left" | "center" | "right";
export type BlockType = "logo" | "heading" | "text" | "image" | "button" | "divider" | "spacer" | "columns";
export type Block = { id: string; type: BlockType; props: Record<string, unknown> };
export type DesignSettings = {
  canvas: string; background: string; width: number; font: string; textColor: string; linkColor: string;
  footerBackground: string; footerText: string;
};
export type Design = { settings: DesignSettings; blocks: Block[] };

export const FONT_STACKS: Record<string, string> = {
  arial: "Arial,Helvetica,sans-serif",
  helvetica: "Helvetica,Arial,sans-serif",
  verdana: "Verdana,Geneva,sans-serif",
  tahoma: "Tahoma,Geneva,sans-serif",
  trebuchet: "'Trebuchet MS',Helvetica,sans-serif",
  georgia: "Georgia,'Times New Roman',serif",
  times: "'Times New Roman',Times,serif",
};
const FONT_LABELS: Record<string, string> = {
  arial: "Arial", helvetica: "Helvetica", verdana: "Verdana", tahoma: "Tahoma", trebuchet: "Trebuchet", georgia: "Georgia", times: "Times",
};

const SWATCHES = ["#1E1E1E", "#454545", "#7A6020", "#C5B27A", "#FFFFFF", "#F2F2F2", "#EDEFE3", "#F5F0E6", "#1F64A8", "#17785C", "#B4531F", "#A8406E"];

export const DEFAULT_SETTINGS: DesignSettings = {
  canvas: "#F2F2F2", background: "#FFFFFF", width: 600, font: "arial", textColor: "#454545", linkColor: "#7A6020",
  footerBackground: "#1E1E1E", footerText: "#BDBDBD",
};

const uid = () => Math.random().toString(36).slice(2, 12);

/** New-block defaults — the same values the server falls back to. */
function newBlock(type: BlockType): Block {
  const base = { paddingY: 12, paddingX: 32, background: null };
  const props: Record<BlockType, Record<string, unknown>> = {
    logo: { ...base, width: 96, align: "center", paddingY: 24 },
    heading: { ...base, text: "Your headline", size: 28, color: "#1E1E1E", align: "left", font: "georgia", weight: "normal" },
    text: { ...base, html: "<p>Write your message. Use {name} to greet each company by name.</p>", size: 15, color: null, align: "left", lineHeight: 1.6, font: null },
    image: { ...base, src: "", alt: "", width: 100, align: "center", link: "", radius: 0 },
    button: { ...base, label: "Request a quote", url: "https://vitorra.org/enquire", color: "#1E1E1E", textColor: "#FFFFFF", size: 15, align: "left", radius: 4, fullWidth: false, paddingY: 16 },
    divider: { ...base, color: "#C5B27A", thickness: 1, width: 100 },
    spacer: { height: 24, background: null, paddingY: 0, paddingX: 0 },
    columns: { ...base, src: "", alt: "", link: "", html: "<p><strong>Feature</strong></p><p>Describe it in a sentence or two.</p>", imageSide: "left", imageWidth: 45, size: 15, color: null },
  };
  return { id: uid(), type, props: props[type] };
}

const PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "columns", label: "Image + text", icon: Columns2 },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "logo", label: "Logo", icon: BadgeCheck },
];

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

export function EmailDesigner({ value, onChange, subject, preheader }: {
  value: Design; onChange: (d: Design) => void; subject?: string; preheader?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const s = { ...DEFAULT_SETTINGS, ...value.settings };
  const blocks = value.blocks;
  const sel = blocks.find((b) => b.id === selected) ?? null;

  const set = (blocksNext: Block[], settingsNext: DesignSettings = s) => onChange({ settings: settingsNext, blocks: blocksNext });
  const patch = (id: string, p: Record<string, unknown>) => set(blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...p } } : b)));
  const add = (type: BlockType) => {
    const b = newBlock(type);
    const at = sel ? blocks.findIndex((x) => x.id === sel.id) + 1 : blocks.length;
    set([...blocks.slice(0, at), b, ...blocks.slice(at)]);
    setSelected(b.id);
  };
  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  const duplicate = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    const copy = { ...blocks[i], id: uid(), props: { ...blocks[i].props } };
    set([...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)]);
    setSelected(copy.id);
  };
  const remove = (id: string) => { set(blocks.filter((b) => b.id !== id)); setSelected(null); };

  const showPreview = async () => {
    setPreviewing(true); setPreviewError("");
    try {
      const r = await apiAdmin<{ data: { html: string } }>("/admin/marketing/designs/render", {
        method: "POST", body: JSON.stringify({ design: value, subject: subject || "Preview", preheader }),
      });
      setPreview(r.data.html);
    } catch (e) { setPreviewError(e instanceof Error ? e.message : "Could not render"); }
    finally { setPreviewing(false); }
  };

  const canvasWidth = device === "mobile" ? 375 : s.width;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[13rem_minmax(0,1fr)_19rem] gap-4 items-start">
      {/* ── Palette ─────────────────────────────────────────────────────── */}
      <aside className="c-panel p-3 xl:sticky xl:top-[62px]">
        <p className="text-[13px] font-semibold text-ink mb-2">Add a block</p>
        <div className="grid grid-cols-2 xl:grid-cols-1 gap-1.5">
          {PALETTE.map((p) => (
            <button key={p.type} type="button" onClick={() => add(p.type)} className="c-btn justify-start w-full">
              <p.icon className="w-4 h-4 text-ink-muted" />{p.label}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-ink-muted mt-3 leading-snug">Blocks are added below the one selected. Click a block on the canvas to edit it.</p>
        <button type="button" onClick={() => setSelected(null)} className="c-btn w-full mt-3" data-active={!sel}>
          <Settings2 className="w-4 h-4" />Email settings
        </button>
      </aside>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <section className="c-panel overflow-hidden">
        <div className="c-panel-head">
          <div className="o-seg" role="group" aria-label="Device">
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor className="w-4 h-4" />Desktop</button>
            <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone className="w-4 h-4" />Mobile</button>
          </div>
          <button type="button" onClick={showPreview} disabled={previewing} className="c-btn">
            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}Preview real email
          </button>
        </div>
        {previewError && <p className="px-4 pt-3 text-[13px] text-alert-ink">{previewError}</p>}
        <div className="overflow-auto p-6" style={{ background: s.canvas }} onClick={() => setSelected(null)}>
          <div className="email-canvas mx-auto transition-[width]" style={{ width: canvasWidth, maxWidth: "100%", background: s.background, fontFamily: FONT_STACKS[s.font], color: s.textColor }}>
            {blocks.length === 0 && (
              <p className="p-10 text-center text-[14px]" style={{ color: "#888" }}>Add a block from the left to start.</p>
            )}
            {blocks.map((b, i) => (
              <div
                key={b.id}
                onClick={(e) => { e.stopPropagation(); setSelected(b.id); }}
                className="relative group cursor-pointer"
                style={{ outline: selected === b.id ? "2px solid #2a78d6" : undefined, outlineOffset: -2 }}
              >
                <CanvasBlock block={b} s={s} canvasWidth={canvasWidth} editing={selected === b.id} onPatch={(p) => patch(b.id, p)} />
                {/* hover outline */}
                <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100" style={{ outline: selected === b.id ? undefined : "1px dashed #2a78d6", outlineOffset: -1 }} />
                {selected === b.id && (
                  <div className="absolute -top-3 right-2 z-10 flex rounded-md shadow-md overflow-hidden" style={{ background: "#2a78d6" }} onClick={(e) => e.stopPropagation()}>
                    {[
                      { icon: ArrowUp, label: "Move up", fn: () => move(b.id, -1), off: i === 0 },
                      { icon: ArrowDown, label: "Move down", fn: () => move(b.id, 1), off: i === blocks.length - 1 },
                      { icon: Copy, label: "Duplicate", fn: () => duplicate(b.id), off: false },
                      { icon: Trash2, label: "Delete", fn: () => remove(b.id), off: false },
                    ].map((a) => (
                      <button key={a.label} type="button" title={a.label} aria-label={a.label} disabled={a.off} onClick={a.fn} className="p-1.5 text-white disabled:opacity-40 hover:bg-white/15">
                        <a.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* The footer is added automatically to every campaign. */}
            <div style={{ background: s.footerBackground, padding: "22px 32px", fontFamily: FONT_STACKS[s.font] }}>
              <p style={{ margin: "0 0 4px", fontFamily: "Georgia,serif", fontSize: 15, color: "#C5B27A" }}>Vitorra Holdings Limited</p>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: s.footerText }}>Padre Pio House, Plot 32, Lumumba Avenue, Kampala · vitorra.org<br />Footer and <u>Unsubscribe</u> link are added to every email automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Properties ──────────────────────────────────────────────────── */}
      <aside className="c-panel p-4 space-y-4 xl:sticky xl:top-[62px] max-h-[calc(100vh-80px)] overflow-y-auto">
        {sel ? (
          <BlockProperties block={sel} onPatch={(p) => patch(sel.id, p)} onClose={() => setSelected(null)} />
        ) : (
          <SettingsPanel s={s} onChange={(next) => set(blocks, next)} />
        )}
      </aside>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setPreview(null)}>
          <div className="bg-paper rounded-md w-full max-w-[760px] h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="c-panel-head">
              <span className="c-panel-title">The email as recipients receive it</span>
              <button type="button" onClick={() => setPreview(null)} className="c-btn c-btn-ghost" aria-label="Close preview"><X className="w-4 h-4" /></button>
            </div>
            <iframe title="Email preview" srcDoc={preview} sandbox="" className="flex-1 w-full border-0 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Canvas rendering (approximates the server's email HTML) ─────────────── */

function CanvasBlock({ block: b, s, canvasWidth, editing, onPatch }: {
  block: Block; s: DesignSettings; canvasWidth: number; editing: boolean; onPatch: (p: Record<string, unknown>) => void;
}) {
  const p = b.props;
  const pad = `${num(p.paddingY, 12)}px ${num(p.paddingX, 32)}px`;
  const bg = str(p.background) || undefined;
  const font = FONT_STACKS[str(p.font) || s.font];
  const align = (str(p.align, "left") as Align);
  const inner = canvasWidth - 2 * num(p.paddingX, 32);
  const wrap = (children: React.ReactNode, a: Align = align) => <div style={{ background: bg, padding: pad, textAlign: a }}>{children}</div>;

  switch (b.type) {
    case "logo":
      return wrap(<img src={str(p.src) || "/logo.png"} alt="Vitorra Holdings" style={{ width: num(p.width, 96), maxWidth: "100%", display: "inline-block" }} />);
    case "heading":
      return wrap(
        <InlineText value={str(p.text)} editing={editing} onChange={(t) => onPatch({ text: t })}
          style={{ margin: 0, fontFamily: FONT_STACKS[str(p.font, "georgia")], fontSize: num(p.size, 28), lineHeight: 1.25, fontWeight: str(p.weight) === "bold" ? 700 : 400, color: str(p.color, "#1E1E1E") }} />
      );
    case "text":
      return wrap(
        <RichText html={str(p.html)} editing={editing} onChange={(h) => onPatch({ html: h })} linkColor={s.linkColor}
          style={{ fontFamily: font, fontSize: num(p.size, 15), lineHeight: num(p.lineHeight, 1.6), color: str(p.color) || s.textColor }} />
      );
    case "image": {
      const w = Math.round(inner * num(p.width, 100) / 100);
      return wrap(str(p.src)
        ? <img src={str(p.src)} alt={str(p.alt)} style={{ width: w, maxWidth: "100%", height: "auto", borderRadius: num(p.radius, 0), display: "inline-block" }} />
        : <ImagePlaceholder />);
    }
    case "button":
      return wrap(
        <span style={{
          display: p.fullWidth ? "block" : "inline-block", background: str(p.color, "#1E1E1E"), color: str(p.textColor, "#FFFFFF"),
          fontFamily: font, fontSize: num(p.size, 15), fontWeight: 700, borderRadius: num(p.radius, 4), textAlign: "center",
          padding: `${Math.round(num(p.size, 15) * 0.9)}px ${Math.round(num(p.size, 15) * 1.8)}px`,
        }}>{str(p.label)}</span>
      );
    case "divider":
      return wrap(<div style={{ width: `${num(p.width, 100)}%`, margin: "0 auto", borderTop: `${num(p.thickness, 1)}px solid ${str(p.color, "#C5B27A")}` }} />, "center");
    case "spacer":
      return <div style={{ height: num(p.height, 24), background: bg }} />;
    case "columns": {
      const img = (
        <div style={{ width: `${num(p.imageWidth, 45)}%`, flexShrink: 0 }}>
          {str(p.src) ? <img src={str(p.src)} alt={str(p.alt)} style={{ width: "100%", display: "block" }} /> : <ImagePlaceholder />}
        </div>
      );
      const text = (
        <div style={{ flex: 1, minWidth: 0 }}>
          <RichText html={str(p.html)} editing={editing} onChange={(h) => onPatch({ html: h })} linkColor={s.linkColor}
            style={{ fontFamily: font, fontSize: num(p.size, 15), lineHeight: 1.6, color: str(p.color) || s.textColor }} />
        </div>
      );
      return wrap(
        <div style={{ display: "flex", gap: 24, flexDirection: canvasWidth < 480 ? "column" : "row", textAlign: "left" }}>
          {str(p.imageSide) === "right" ? <>{text}{img}</> : <>{img}{text}</>}
        </div>
      );
    }
  }
}

function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10" style={{ background: "#F2F2F2", border: "1px dashed #C7CCD3", color: "#59606A", fontSize: 13 }}>
      <ImageIcon className="w-6 h-6" />Choose an image on the right
    </div>
  );
}

/** Plain text edited in place (headings). */
function InlineText({ value, editing, onChange, style }: { value: string; editing: boolean; onChange: (v: string) => void; style: React.CSSProperties }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);
  return (
    <h1 ref={ref} style={{ ...style, outline: "none", cursor: editing ? "text" : "pointer" }} contentEditable={editing} suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget.innerText || "").replace(/\n/g, " "))} />
  );
}

const TEXT_TOOLS = [
  { i: Bold, t: "Bold", c: "bold" }, { i: Italic, t: "Italic", c: "italic" }, { i: Underline, t: "Underline", c: "underline" },
  { i: List, t: "Bullets", c: "insertUnorderedList" }, { i: ListOrdered, t: "Numbered list", c: "insertOrderedList" },
  { i: Link2, t: "Link", c: "link" }, { i: Eraser, t: "Clear formatting", c: "removeFormat" },
];

/** Rich text edited in place, with a small formatting bar while selected. */
function RichText({ html, editing, onChange, style, linkColor }: {
  html: string; editing: boolean; onChange: (h: string) => void; style: React.CSSProperties; linkColor: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html;
  }, [html]);
  const cmd = (c: string, v?: string) => {
    ref.current?.focus();
    document.execCommand(c, false, v);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  const link = () => {
    const url = window.prompt("Link address (https://…)", "https://");
    if (url && /^(https?:\/\/|mailto:|tel:)/i.test(url)) cmd("createLink", url);
  };
  return (
    <div>
      {editing && (
        <div className="flex flex-wrap gap-0.5 mb-2 p-1 rounded" style={{ background: "#1F2328" }} onMouseDown={(e) => e.preventDefault()}>
          {TEXT_TOOLS.map((b) => (
            <button key={b.t} type="button" title={b.t} aria-label={b.t} onClick={() => (b.c === "link" ? link() : cmd(b.c))} className="p-1.5 rounded text-white hover:bg-white/15"><b.i className="w-3.5 h-3.5" /></button>
          ))}
          <label title="Text colour" className="flex items-center gap-1 px-1.5 text-white text-[12px] cursor-pointer">
            A<input type="color" className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer" onChange={(e) => cmd("foreColor", e.target.value)} />
          </label>
        </div>
      )}
      <div ref={ref} contentEditable={editing} suppressContentEditableWarning
        className="[&_p]:m-0 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:underline"
        style={{ ...style, outline: "none", cursor: editing ? "text" : "pointer", ["--lk" as string]: linkColor }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)} />
    </div>
  );
}

/* ─── Properties panels ──────────────────────────────────────────────────── */

function SettingsPanel({ s, onChange }: { s: DesignSettings; onChange: (s: DesignSettings) => void }) {
  const up = (p: Partial<DesignSettings>) => onChange({ ...s, ...p });
  return (
    <>
      <p className="text-[15px] font-semibold text-ink">Email settings</p>
      <ColorField label="Outside background" value={s.canvas} onChange={(v) => up({ canvas: v })} />
      <ColorField label="Email background" value={s.background} onChange={(v) => up({ background: v })} />
      <ColorField label="Text colour" value={s.textColor} onChange={(v) => up({ textColor: v })} />
      <ColorField label="Link colour" value={s.linkColor} onChange={(v) => up({ linkColor: v })} />
      <FontField label="Font" value={s.font} onChange={(v) => up({ font: v ?? "arial" })} />
      <RangeField label="Email width" value={s.width} min={480} max={720} step={10} unit="px" onChange={(v) => up({ width: v })} />
      <ColorField label="Footer background" value={s.footerBackground} onChange={(v) => up({ footerBackground: v })} />
      <ColorField label="Footer text" value={s.footerText} onChange={(v) => up({ footerText: v })} />
    </>
  );
}

function BlockProperties({ block: b, onPatch, onClose }: { block: Block; onPatch: (p: Record<string, unknown>) => void; onClose: () => void }) {
  const p = b.props;
  const label = PALETTE.find((x) => x.type === b.type)?.label ?? b.type;
  const spacing = b.type !== "spacer" && (
    <>
      <RangeField label="Space above and below" value={num(p.paddingY, 12)} min={0} max={80} unit="px" onChange={(v) => onPatch({ paddingY: v })} />
      <RangeField label="Space at the sides" value={num(p.paddingX, 32)} min={0} max={80} unit="px" onChange={(v) => onPatch({ paddingX: v })} />
    </>
  );
  const background = <ColorField label="Block background" value={str(p.background)} allowNone onChange={(v) => onPatch({ background: v || null })} />;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        <button type="button" onClick={onClose} className="text-[13px] text-gold-ink hover:underline">Email settings</button>
      </div>

      {b.type === "logo" && (<>
        <RangeField label="Size" value={num(p.width, 96)} min={32} max={300} unit="px" onChange={(v) => onPatch({ width: v })} />
        <AlignField value={str(p.align, "center") as Align} onChange={(v) => onPatch({ align: v })} />
      </>)}

      {b.type === "heading" && (<>
        <TextField label="Text" value={str(p.text)} onChange={(v) => onPatch({ text: v })} />
        <RangeField label="Size" value={num(p.size, 28)} min={14} max={56} unit="px" onChange={(v) => onPatch({ size: v })} />
        <ColorField label="Colour" value={str(p.color, "#1E1E1E")} onChange={(v) => onPatch({ color: v })} />
        <FontField label="Font" value={str(p.font, "georgia")} onChange={(v) => onPatch({ font: v })} />
        <SegField label="Weight" value={str(p.weight, "normal")} options={[["normal", "Regular"], ["bold", "Bold"]]} onChange={(v) => onPatch({ weight: v })} />
        <AlignField value={str(p.align, "left") as Align} onChange={(v) => onPatch({ align: v })} />
      </>)}

      {b.type === "text" && (<>
        <p className="text-[13px] text-ink-muted">Type straight onto the canvas. Select words to make them bold, a link, a list or another colour.</p>
        <RangeField label="Text size" value={num(p.size, 15)} min={11} max={28} unit="px" onChange={(v) => onPatch({ size: v })} />
        <RangeField label="Line spacing" value={num(p.lineHeight, 1.6)} min={1.1} max={2.2} step={0.1} onChange={(v) => onPatch({ lineHeight: v })} />
        <ColorField label="Colour" value={str(p.color)} allowNone onChange={(v) => onPatch({ color: v || null })} />
        <FontField label="Font" value={str(p.font) || null} allowInherit onChange={(v) => onPatch({ font: v })} />
        <AlignField value={str(p.align, "left") as Align} onChange={(v) => onPatch({ align: v })} />
      </>)}

      {(b.type === "image" || b.type === "columns") && (<>
        <ImageField value={str(p.src)} onChange={(v) => onPatch({ src: v })} />
        <TextField label="Description (for screen readers and blocked images)" value={str(p.alt)} onChange={(v) => onPatch({ alt: v })} />
        <TextField label="Link when clicked (optional)" value={str(p.link)} placeholder="https://" onChange={(v) => onPatch({ link: v })} />
      </>)}
      {b.type === "image" && (<>
        <RangeField label="Width" value={num(p.width, 100)} min={10} max={100} unit="%" onChange={(v) => onPatch({ width: v })} />
        <AlignField value={str(p.align, "center") as Align} onChange={(v) => onPatch({ align: v })} />
        <RangeField label="Rounded corners" value={num(p.radius, 0)} min={0} max={40} unit="px" onChange={(v) => onPatch({ radius: v })} />
      </>)}
      {b.type === "columns" && (<>
        <SegField label="Image side" value={str(p.imageSide, "left")} options={[["left", "Left"], ["right", "Right"]]} onChange={(v) => onPatch({ imageSide: v })} />
        <RangeField label="Image width" value={num(p.imageWidth, 45)} min={25} max={65} unit="%" onChange={(v) => onPatch({ imageWidth: v })} />
        <RangeField label="Text size" value={num(p.size, 15)} min={11} max={24} unit="px" onChange={(v) => onPatch({ size: v })} />
        <ColorField label="Text colour" value={str(p.color)} allowNone onChange={(v) => onPatch({ color: v || null })} />
        <p className="text-[13px] text-ink-muted">On phones the image sits above the text.</p>
      </>)}

      {b.type === "button" && (<>
        <TextField label="Label" value={str(p.label)} onChange={(v) => onPatch({ label: v })} />
        <TextField label="Link" value={str(p.url)} placeholder="https://" onChange={(v) => onPatch({ url: v })} />
        <ColorField label="Button colour" value={str(p.color, "#1E1E1E")} onChange={(v) => onPatch({ color: v })} />
        <ColorField label="Label colour" value={str(p.textColor, "#FFFFFF")} onChange={(v) => onPatch({ textColor: v })} />
        <RangeField label="Size" value={num(p.size, 15)} min={12} max={22} unit="px" onChange={(v) => onPatch({ size: v })} />
        <RangeField label="Rounded corners" value={num(p.radius, 4)} min={0} max={30} unit="px" onChange={(v) => onPatch({ radius: v })} />
        <AlignField value={str(p.align, "left") as Align} onChange={(v) => onPatch({ align: v })} />
        <label className="flex items-center gap-2 text-[14px] text-ink-soft">
          <input type="checkbox" checked={Boolean(p.fullWidth)} onChange={(e) => onPatch({ fullWidth: e.target.checked })} />Full width
        </label>
      </>)}

      {b.type === "divider" && (<>
        <ColorField label="Colour" value={str(p.color, "#C5B27A")} onChange={(v) => onPatch({ color: v })} />
        <RangeField label="Thickness" value={num(p.thickness, 1)} min={1} max={8} unit="px" onChange={(v) => onPatch({ thickness: v })} />
        <RangeField label="Width" value={num(p.width, 100)} min={10} max={100} unit="%" onChange={(v) => onPatch({ width: v })} />
      </>)}

      {b.type === "spacer" && (
        <RangeField label="Height" value={num(p.height, 24)} min={4} max={120} unit="px" onChange={(v) => onPatch({ height: v })} />
      )}

      {background}
      {spacing}
    </>
  );
}

/* ─── Fields ──────────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[13px] text-ink-muted mb-1">{label}</p>{children}</div>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Field label={label}><input className="c-input w-full" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}

function RangeField({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
        <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className="c-input w-[4.5rem] text-right" />
        {unit && <span className="text-[13px] text-ink-muted w-5">{unit}</span>}
      </div>
    </Field>
  );
}

function ColorField({ label, value, onChange, allowNone }: { label: string; value: string; onChange: (v: string) => void; allowNone?: boolean }) {
  const valid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={valid ? value : "#FFFFFF"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="w-9 h-9 p-0.5 rounded border border-line-strong bg-paper cursor-pointer" aria-label={label} />
        <input className="c-input flex-1 font-mono uppercase" value={value} placeholder={allowNone ? "None" : "#000000"} onChange={(e) => onChange(e.target.value.trim())} maxLength={7} />
        {allowNone && value && <button type="button" onClick={() => onChange("")} className="text-[12px] text-ink-muted hover:text-ink">None</button>}
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {SWATCHES.map((c) => (
          <button key={c} type="button" title={c} aria-label={c} onClick={() => onChange(c)} className="w-5 h-5 rounded-sm border border-line-strong" style={{ background: c, outline: value.toUpperCase() === c ? "2px solid #2a78d6" : undefined, outlineOffset: 1 }} />
        ))}
      </div>
    </Field>
  );
}

function FontField({ label, value, onChange, allowInherit }: { label: string; value: string | null; onChange: (v: string | null) => void; allowInherit?: boolean }) {
  return (
    <Field label={label}>
      <select className="c-select w-full" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        {allowInherit && <option value="">Same as email</option>}
        {Object.keys(FONT_STACKS).map((f) => <option key={f} value={f} style={{ fontFamily: FONT_STACKS[f] }}>{FONT_LABELS[f]}</option>)}
      </select>
    </Field>
  );
}

function SegField({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="o-seg w-full">{options.map(([v, l]) => <button key={v} type="button" className="flex-1 justify-center" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div>
    </Field>
  );
}

function AlignField({ value, onChange }: { value: Align; onChange: (v: Align) => void }) {
  return (
    <Field label="Alignment">
      <div className="o-seg w-full">
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([v, I]) => (
          <button key={v} type="button" className="flex-1 justify-center" aria-pressed={value === v} aria-label={`Align ${v}`} onClick={() => onChange(v)}><I className="w-4 h-4" /></button>
        ))}
      </div>
    </Field>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file: File) => {
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      form.append("file", file);
      onChange((await uploadAdmin<{ data: { url: string } }>("/admin/marketing/designs/upload", form)).data.url);
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  };
  return (
    <Field label="Image">
      {value && <img src={value} alt="" className="w-full max-h-32 object-contain rounded border border-line mb-2 bg-paper-deep" />}
      <label className="c-btn w-full cursor-pointer">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Upload image (JPG, PNG, GIF)
        <input type="file" accept="image/jpeg,image/png,image/gif" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      <input className="c-input w-full mt-2" value={value} placeholder="…or paste an image address" onChange={(e) => onChange(e.target.value.trim())} />
      {err && <p className="text-[12px] text-alert-ink mt-1">{err}</p>}
    </Field>
  );
}
