"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { API_BASE_URL as API } from "@/lib/constants";

/* Careers board — Quiet Authority. The real launch-team photograph beside the
   heading, then openings as hairline rows: title in the display serif,
   department · location · type as quiet labels. */

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-20">
        <div className="lg:col-span-6">
          <p className="t-label text-ink-muted mb-8 q-rise">{t("joinTeam")}</p>
          <h1 className="t-display text-ink q-rise">{t("heroTitle")}</h1>
          <p className="t-lead text-ink-soft mt-8 max-w-[34rem] q-rise">{t("heroBody")}</p>
        </div>
        <figure className="lg:col-span-6 m-0">
          <div className="relative overflow-hidden rounded-frame bg-paper-deep q-unveil" style={{ aspectRatio: "3/2" }}>
            <div className="q-inner absolute inset-0">
              <Image src="/press/launch-team.jpg" alt={t("teamPhotoAlt")} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          </div>
          <figcaption className="t-small text-ink-muted mt-3 flex gap-3">
            <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-line-strong" />
            {t("teamPhotoCaption")}
          </figcaption>
        </figure>
      </div>

      <h2 className="t-label text-ink-muted pb-4 border-b border-line-strong">{t("openRoles")}</h2>

      {!openings ? (
        <p className="flex items-center gap-2 t-small text-ink-muted py-10"><Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />{t("loadingRoles")}</p>
      ) : openings.length === 0 ? (
        <div className="py-14 max-w-[32rem]">
          <p className="t-h3 text-ink">{t("noRolesTitle")}</p>
          <p className="t-body text-ink-muted mt-3">{t("noRolesBody")}</p>
        </div>
      ) : (
        <ul>
          {openings.map((o) => (
            <li key={o.slug} className="border-b border-line">
              <Link href={`/careers/${o.slug}`} className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-8 items-baseline">
                <span className="md:col-span-6 t-h3 text-ink group-hover:text-gold-ink transition-colors">{o.title}</span>
                <span className="md:col-span-5 t-label text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
                  {o.department && <span>{o.department}</span>}
                  {o.location && <span>{o.location}</span>}
                  <span className="text-gold-ink">{typeLabel(o.employment_type)}</span>
                </span>
                <ArrowRight aria-hidden="true" className="hidden md:block md:col-span-1 justify-self-end w-4 h-4 text-ink-muted transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
