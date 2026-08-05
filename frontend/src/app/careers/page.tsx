"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { API_BASE_URL as API } from "@/lib/constants";

type Opening = {
  title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; closes_at: string | null;
};

export default function CareersPage() {
  const t = useTranslations("careersPortal");
  const [openings, setOpenings] = useState<Opening[] | null>(null);

  const typeLabel = (type: string) =>
    ({ full_time: t("typeFullTime"), part_time: t("typePartTime"), contract: t("typeContract"), internship: t("typeInternship") } as Record<string, string>)[type] ?? type;

  useEffect(() => {
    fetch(`${API}/careers/openings`).then((r) => r.json()).then((d) => setOpenings(d.data ?? [])).catch(() => setOpenings([]));
  }, []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "#C5B27A" }}>{t("joinTeam")}</p>
      <h1 className="mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "40px", fontWeight: 700, letterSpacing: "-0.02em", color: "#1E1E1E", lineHeight: 1.1 }}>
        {t("heroTitle")}
      </h1>
      <p className="text-base max-w-2xl mb-10" style={{ color: "#555", lineHeight: 1.7 }}>
        {t("heroBody")}
      </p>

      {!openings ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />{t("loadingRoles")}</div>
      ) : openings.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-black/[0.06] p-10 text-center">
          <p className="text-base font-semibold mb-1" style={{ color: "#1E1E1E" }}>{t("noRolesTitle")}</p>
          <p className="text-sm" style={{ color: "#999" }}>{t("noRolesBody")}</p>
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
                  <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}>{typeLabel(o.employment_type)}</span>
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
