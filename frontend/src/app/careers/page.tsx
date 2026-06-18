"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, Briefcase, ArrowRight } from "lucide-react";

type Opening = {
  title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; closes_at: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship",
};

export default function CareersPage() {
  const [openings, setOpenings] = useState<Opening[] | null>(null);

  useEffect(() => {
    fetch(`${API}/careers/openings`).then((r) => r.json()).then((d) => setOpenings(d.data ?? [])).catch(() => setOpenings([]));
  }, []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "#C5B27A" }}>Join the team</p>
      <h1 className="mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "40px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E", lineHeight: 1.1 }}>
        Build the future of African enterprise
      </h1>
      <p className="text-base max-w-2xl mb-10" style={{ color: "#555", lineHeight: 1.7 }}>
        Vitorra Holdings operates across fuel technology, healthcare, premium coffee, and logistics. Explore our open roles below.
      </p>

      {!openings ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading roles…</div>
      ) : openings.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-black/[0.06] p-10 text-center">
          <p className="text-base font-semibold mb-1" style={{ color: "#1E1E1E" }}>No open roles right now</p>
          <p className="text-sm" style={{ color: "#999" }}>Check back soon — we&apos;re growing across all sectors.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {openings.map((o) => (
            <Link key={o.slug} href={`/careers/${o.slug}`}
              className="group flex items-center gap-4 bg-white rounded-[20px] border p-5 transition-colors hover:border-[#C5B27A]"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold mb-1.5" style={{ color: "#1E1E1E" }}>{o.title}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "#999" }}>
                  {o.department && <span className="inline-flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{o.department}</span>}
                  {o.location && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{o.location}</span>}
                  <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}>{TYPE_LABEL[o.employment_type] ?? o.employment_type}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#C5B27A" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
