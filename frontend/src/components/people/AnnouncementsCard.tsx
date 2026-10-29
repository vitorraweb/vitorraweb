"use client";

import { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";
import { apiStaff } from "@/lib/staff-auth";

/* Company notices for the signed-in person (everyone + their department),
   pinned first. Posted by HR in People → Announcements. Hidden when empty. */

export type Announcement = { id: number; title: string; body: string; department: string | null; pinned: boolean; created_at: string; author: string | null };

export function AnnouncementsCard() {
  const [list, setList] = useState<Announcement[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => { apiStaff<{ data: Announcement[] }>("/staff/announcements").then((r) => setList(r.data)).catch(() => setList([])); }, []);

  if (!list?.length) return null;

  return (
    <div className="bg-white rounded-[18px] border p-5 mb-4" style={{ borderColor: "var(--o-line)" }}>
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--o-faint)" }}>
        <Megaphone className="w-3.5 h-3.5" />Announcements
      </h3>
      <ul className="divide-y divide-[var(--o-line)]">
        {list.map((a) => (
          <li key={a.id} className="py-2.5">
            <button className="w-full text-left" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
              <span className="flex items-start gap-2">
                {a.pinned && <Pin className="w-3.5 h-3.5 mt-1 shrink-0" style={{ color: "var(--o-accent-text)" }} aria-label="Pinned" />}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: "var(--o-text)" }}>{a.title}</span>
                  <span className="block text-xs" style={{ color: "var(--o-faint)" }}>
                    {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{a.author ? ` · ${a.author}` : ""}{a.department ? ` · ${a.department}` : ""}
                  </span>
                </span>
              </span>
            </button>
            <p className={`text-sm whitespace-pre-line mt-1.5 ${open === a.id ? "" : "line-clamp-2"}`} style={{ color: "var(--o-text-2)", lineHeight: 1.6 }}>{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
