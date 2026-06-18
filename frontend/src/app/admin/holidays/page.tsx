"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, CalendarDays, Ban } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";

type Holiday = { id: number; name: string; date: string; recurring: boolean };
type Event = { id: number; title: string; description: string | null; start_date: string; end_date: string; blocks_leave: boolean };

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [hName, setHName] = useState(""); const [hDate, setHDate] = useState(""); const [hRec, setHRec] = useState(false);
  const [eTitle, setETitle] = useState(""); const [eStart, setEStart] = useState(""); const [eEnd, setEEnd] = useState(""); const [eBlock, setEBlock] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [h, e] = await Promise.all([
        apiAdmin<{ data: Holiday[] }>("/admin/holidays"),
        apiAdmin<{ data: Event[] }>("/admin/events"),
      ]);
      setHolidays(h.data); setEvents(e.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addHoliday = async () => {
    if (!hName.trim() || !hDate) { setMsg("Holiday needs a name and date."); return; }
    setMsg("");
    try { await apiAdmin("/admin/holidays", { method: "POST", body: JSON.stringify({ name: hName.trim(), date: hDate, recurring: hRec }) }); setHName(""); setHDate(""); setHRec(false); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };
  const delHoliday = async (id: number) => { if (!confirm("Remove this holiday?")) return; try { await apiAdmin(`/admin/holidays/${id}`, { method: "DELETE" }); setHolidays((l) => l.filter((h) => h.id !== id)); } catch { /* */ } };

  const addEvent = async () => {
    if (!eTitle.trim() || !eStart || !eEnd) { setMsg("Event needs a title and dates."); return; }
    if (eEnd < eStart) { setMsg("Event end can't be before start."); return; }
    setMsg("");
    try { await apiAdmin("/admin/events", { method: "POST", body: JSON.stringify({ title: eTitle.trim(), start_date: eStart, end_date: eEnd, blocks_leave: eBlock }) }); setETitle(""); setEStart(""); setEEnd(""); setEBlock(true); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed."); }
  };
  const delEvent = async (id: number) => { if (!confirm("Remove this event?")) return; try { await apiAdmin(`/admin/events/${id}`, { method: "DELETE" }); setEvents((l) => l.filter((ev) => ev.id !== id)); } catch { /* */ } };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  return (
    <div className="max-w-3xl pb-16">
      <PageHeader title="Holidays & events" subtitle="Public holidays exclude days from leave; events can block leave for a period." />
      {msg && <p className="text-sm mb-4" style={{ color: "#C0392B" }}>{msg}</p>}

      {/* Public holidays */}
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4"><CalendarDays className="w-4 h-4" style={{ color: "#C5B27A" }} /><h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Public holidays</h3></div>
        <div className="space-y-2 mb-4">
          {holidays.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "#F7F7F5" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "#1E1E1E" }}>{h.name}</p>
                <p className="text-xs" style={{ color: "#999" }}>{fmt(h.date)}{h.recurring ? " · repeats yearly" : ""}</p>
              </div>
              <button onClick={() => delHoliday(h.id)} className="p-2 rounded-lg shrink-0" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="Holiday name" className="text-sm rounded-xl px-3 py-2 border flex-1 min-w-[10rem]" style={inputStyle} />
          <input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={inputStyle} />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "#777" }}><input type="checkbox" checked={hRec} onChange={(e) => setHRec(e.target.checked)} className="accent-[#C5B27A]" />Repeats yearly</label>
          <button onClick={addHoliday} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />Add</button>
        </div>
      </div>

      {/* Company events / blackouts */}
      <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
        <div className="flex items-center gap-2 mb-4"><Ban className="w-4 h-4" style={{ color: "#C5B27A" }} /><h3 className="text-sm font-bold uppercase tracking-[0.08em]" style={{ color: "#1E1E1E" }}>Company events & blackouts</h3></div>
        <div className="space-y-2 mb-4">
          {events.length === 0 && <p className="text-xs" style={{ color: "#bbb" }}>No events yet.</p>}
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "#F7F7F5" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "#1E1E1E" }}>{ev.title} {ev.blocks_leave && <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ml-1" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>blocks leave</span>}</p>
                <p className="text-xs" style={{ color: "#999" }}>{fmt(ev.start_date)} → {fmt(ev.end_date)}</p>
              </div>
              <button onClick={() => delEvent(ev.id)} className="p-2 rounded-lg shrink-0" style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Event title" className="text-sm rounded-xl px-3 py-2 border sm:col-span-2" style={inputStyle} />
          <input type="date" value={eStart} onChange={(e) => setEStart(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={inputStyle} />
          <input type="date" value={eEnd} onChange={(e) => setEEnd(e.target.value)} className="text-sm rounded-xl px-3 py-2 border" style={inputStyle} />
        </div>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "#777" }}><input type="checkbox" checked={eBlock} onChange={(e) => setEBlock(e.target.checked)} className="accent-[#C5B27A]" />Block leave during this period</label>
          <button onClick={addEvent} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#1E1E1E", color: "#fff" }}><Plus className="w-4 h-4" />Add event</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
