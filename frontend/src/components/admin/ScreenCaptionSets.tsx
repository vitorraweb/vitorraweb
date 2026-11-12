"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/* ─── Screen editor: further headlines on one video or design ────────────────
   The first headline (line 1, line 2, small line) shows from the start. Each
   set added here takes over at its own second of the same video or design,
   in the order listed. A field left blank keeps the wording before it, so a
   set can change only the small line, or only line 2. No second given: it
   comes an even gap after the one before (worked out on the server too).   */

export type CaptionSet = { line1?: string | null; line2?: string | null; small?: string | null; at?: number | null };

export const MAX_CAPTIONS = 5;

/** When each set will show, as the screen will play it (mirrors ScreenMedia::captionsFor). */
function plannedSeconds(sets: CaptionSet[], seconds: number): (number | null)[] {
  const worded = sets.filter((c) => c.line1?.trim() || c.line2?.trim() || c.small?.trim()).length;
  const gap = Math.max(1, Math.round(seconds / (worded + 1)));
  let prev = 0;
  return sets.map((c) => {
    if (!(c.line1?.trim() || c.line2?.trim() || c.small?.trim())) return null;
    const at = Math.max(prev + 1, c.at ?? prev + gap);
    if (at > seconds - 1) return null;
    prev = at;
    return at;
  });
}

export function ScreenCaptionSets({
  initial,
  seconds,
  onSave,
}: {
  initial: CaptionSet[];
  seconds: number;
  onSave: (sets: CaptionSet[]) => void;
}) {
  const [sets, setSets] = useState<CaptionSet[]>(initial);
  const planned = plannedSeconds(sets, seconds);

  const clean = (list: CaptionSet[]) =>
    list.map((c) => ({ line1: c.line1?.trim() || null, line2: c.line2?.trim() || null, small: c.small?.trim() || null, at: c.at || null }));
  const edit = (i: number, patch: Partial<CaptionSet>) => setSets((l) => l.map((c, n) => (n === i ? { ...c, ...patch } : c)));
  const save = (list = sets) => onSave(clean(list).filter((c) => c.line1 || c.line2 || c.small));
  const remove = (i: number) => { const next = sets.filter((_, n) => n !== i); setSets(next); save(next); };

  return (
    <div className="sm:col-span-2">
      {sets.map((c, i) => (
        <fieldset key={i} className="grid sm:grid-cols-[1fr_1fr_8rem] gap-3 mt-3 p-3 rounded" style={{ border: "1px solid var(--o-line)" }}>
          <legend className="px-1 text-[12px] font-semibold">
            Headline {i + 2}
            <span className="font-normal" style={{ color: "var(--o-muted)" }}>
              {planned[i] != null ? `, shows at ${planned[i]} s` : c.line1 || c.line2 || c.small ? `, no time left in the ${seconds} s` : ", add words to show it"}
            </span>
          </legend>
          <label className="block">Line 1 <span className="opacity-70">(white)</span>
            <input className="c-input w-full mt-1" value={c.line1 ?? ""} maxLength={60} placeholder="Blank keeps the line before" onChange={(e) => edit(i, { line1: e.target.value })} onBlur={() => save()} />
          </label>
          <label className="block">Line 2 <span className="opacity-70">(business colour)</span>
            <input className="c-input w-full mt-1" value={c.line2 ?? ""} maxLength={60} placeholder="Blank keeps the line before" onChange={(e) => edit(i, { line2: e.target.value })} onBlur={() => save()} />
          </label>
          <label className="block">Appears at
            <span className="flex items-center gap-1 mt-1">
              <input type="number" min={1} max={Math.max(1, seconds - 1)} className="c-input w-full" value={c.at ?? ""} placeholder="auto"
                onChange={(e) => edit(i, { at: e.target.value ? Math.max(1, Math.min(59, Math.round(Number(e.target.value)))) : null })} onBlur={() => save()} />
              <span>s</span>
            </span>
          </label>
          <label className="block sm:col-span-2">Small line <span className="opacity-70">(under the headline)</span>
            <input className="c-input w-full mt-1" value={c.small ?? ""} maxLength={120} placeholder="Blank keeps the small line before" onChange={(e) => edit(i, { small: e.target.value })} onBlur={() => save()} />
          </label>
          <div className="flex items-end justify-end">
            <button type="button" className="c-btn c-btn-ghost" aria-label={`Remove headline ${i + 2}`} onClick={() => remove(i)}>
              <Trash2 aria-hidden="true" className="w-4 h-4" style={{ color: "var(--o-danger)" }} />Remove
            </button>
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3 flex-wrap mt-3">
        <button type="button" className="c-btn" disabled={sets.length >= MAX_CAPTIONS} onClick={() => setSets((l) => [...l, {}])}>
          <Plus aria-hidden="true" className="w-4 h-4" />Add another headline
        </button>
        <span className="text-[12px]" style={{ color: "var(--o-muted)" }}>
          {sets.length >= MAX_CAPTIONS
            ? `Up to ${MAX_CAPTIONS} more headlines on one item.`
            : "Each one takes over at its second, in this order. Leave a field blank to keep what was on screen; leave the second blank to space them evenly."}
        </span>
      </div>
    </div>
  );
}
