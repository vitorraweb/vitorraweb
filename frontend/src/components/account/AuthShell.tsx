import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";

/* ─── Sign-in / sign-up shell — Quiet Authority ───────────────────────────────
   The real head-office reception on one side (the Vitorra sign), a calm paper
   form on the other. On phones the photograph becomes a short band above the
   form so the brand is still the first thing seen. */

export default function AuthShell({
  lead,
  accent,
  children,
}: {
  lead: string;
  accent: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("account");
  const alt = useTranslations("imageAlt");
  const PERKS = [t("perk1"), t("perk2"), t("perk3")];

  return (
    <section className="q-scope grid lg:grid-cols-2 min-h-dvh bg-paper">
      {/* ── Photograph panel ─────────────────────────────────────────────── */}
      <div className="relative isolate overflow-hidden bg-ink text-ink-fg min-h-[34svh] lg:min-h-0 flex flex-col">
        <Image src="/hero/brand-wall.jpg" alt={alt("reception")} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10 object-cover q-settle" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(20,20,20,0.96)_0%,rgba(20,20,20,0.86)_48%,rgba(20,20,20,0.4)_75%,rgba(20,20,20,0.3)_100%)]" />

        <div className="flex items-center justify-between p-6 lg:p-12">
          <Link href="/" aria-label="Vitorra Holdings Limited, home" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={36} height={36} />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.375rem] text-ink-fg">Vitorra</span>
              <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-fg-muted mt-1">Holdings Limited</span>
            </span>
          </Link>
          <Link href="/" className="q-link t-small text-ink-fg">
            {t("backToSite")}<ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-auto p-6 lg:p-12 hidden lg:block max-w-[30rem]">
          <p className="t-label text-ink-fg-muted mb-6">{t("shellEyebrow")}</p>
          <h2 className="t-display text-ink-fg">{lead} {accent}</h2>
          <ul className="mt-10 border-t border-ink-fg/15">
            {PERKS.map((p, i) => (
              <li key={p} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4 border-b border-ink-fg/15">
                <span className="t-label font-numeric text-gold pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-small text-ink-fg/85">{p}</span>
              </li>
            ))}
          </ul>
          <p className="t-small text-ink-fg-muted mt-8">{t("shellTagline")}</p>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-5 py-14 lg:py-20 bg-paper">
        <div className="w-full max-w-[26rem]">{children}</div>
      </div>
    </section>
  );
}
