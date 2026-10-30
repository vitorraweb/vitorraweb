"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, Loader2, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requestBuyersPack } from "@/lib/api";
import { isValidPhone } from "@/lib/phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";
import { Section, Container, Label as Eyebrow, Heading, Text } from "@/components/system";

/* ─── FET Buyer's Pack ────────────────────────────────────────────────────────
   The light first step for a visitor who is interested but not ready to ask
   for a quote — most of the FET page's traffic. Name, email and fleet size buy
   the published price list, the which-device guide and the datasheet, emailed
   and also unlocked right here. The request lands in Enquiries as an FET lead
   so sales can offer the free assessment. Only public material is in the pack. */

const FLEET = ["1", "2-5", "6-20", "21-50", "50+"] as const;
const VEHICLE = ["car", "suv", "lighttruck", "heavytruck", "mixed"] as const;

export function FetBuyersPack({ id = "fet-pack" }: { id?: string }) {
  const t = useTranslations("buyersPack");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", fleet_size: "", vehicle: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [token, setToken] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("errName");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = t("errEmail");
    if (form.phone.trim() && !isValidPhone(form.phone)) errs.phone = t("errPhone");
    if (!form.fleet_size) errs.fleet_size = t("errFleet");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("sending");
    try {
      await requestBuyersPack({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined, fleet_size: form.fleet_size, vehicle: form.vehicle || undefined,
      }, token || undefined);
      setState("done");
    } catch {
      setState("error");
      turnstile.current?.reset();
      setToken("");
    }
  };

  const inside = [t("inside1"), t("inside2"), t("inside3"), t("inside4")];
  const selectCls = "w-full h-12 rounded-[2px] px-3 text-[14px] bg-white border border-line-strong text-ink outline-none focus:border-ink";
  const inputCls = "mt-1.5 h-12 rounded-[2px] px-3 text-[14px] bg-white border-line-strong shadow-none focus-visible:ring-0 focus-visible:border-ink";

  return (
    <Section tone="cream" id={id} aria-labelledby={`${id}-title`}>
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading id={`${id}-title`} size="h2" className="mt-6 text-ink">{t("title")}</Heading>
          <Text className="mt-6 max-w-[32rem]">{t("body")}</Text>
          <ul className="mt-8 border-t border-line-strong">
            {inside.map((item) => (
              <li key={item} className="flex items-baseline gap-3 py-3.5 border-b border-line t-small text-ink">
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-ink translate-y-[0.15em]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {state === "done" ? (
            <div role="status" className="bg-paper border border-line p-6 sm:p-8">
              <p className="t-label text-gold-ink">{t("doneLabel")}</p>
              <p className="t-h3 text-ink mt-3">{t("doneTitle", { name: form.name.split(" ")[0] })}</p>
              <Text className="mt-3">{t("doneBody")}</Text>
              <div className="mt-6 flex flex-col items-start gap-3">
                {[
                  { href: "/downloads/vitorra-fet-application-guide.pdf", label: t("dlGuide") },
                  { href: "/downloads/vitorra-fet-datasheet.pdf", label: t("dlDatasheet") },
                ].map((d) => (
                  <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="q-link t-small text-ink">
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />{d.label}
                  </a>
                ))}
                <Link href="/products/fuel-eco-tech/catalogue" className="q-link t-small text-ink">{t("dlCatalogue")}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="mt-8 pt-6 border-t border-line">
                <p className="t-small text-ink">{t("nextStep")}</p>
                <Link href="/enquire?sector=FET" className="q-btn bg-ink text-paper hover:bg-black mt-4">{t("nextCta")}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="bg-paper border border-line p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor={`${id}-name`}>{t("fieldName")}</Label>
                <Input id={`${id}-name`} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} className={inputCls} />
                {errors.name && <p role="alert" className="mt-1 t-small text-alert-ink">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor={`${id}-email`}>{t("fieldEmail")}</Label>
                <Input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} className={inputCls} />
                {errors.email && <p role="alert" className="mt-1 t-small text-alert-ink">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor={`${id}-phone`}>{t("fieldPhone")}</Label>
                <Input id={`${id}-phone`} type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} className={inputCls} />
                {errors.phone && <p role="alert" className="mt-1 t-small text-alert-ink">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor={`${id}-fleet`}>{t("fieldFleet")}</Label>
                <select id={`${id}-fleet`} value={form.fleet_size} onChange={(e) => set("fleet_size", e.target.value)} aria-invalid={!!errors.fleet_size} className={`${selectCls} mt-1.5`}>
                  <option value="">{t("choose")}</option>
                  {FLEET.map((f) => <option key={f} value={f}>{t(`fleet.${f}`)}</option>)}
                </select>
                {errors.fleet_size && <p role="alert" className="mt-1 t-small text-alert-ink">{errors.fleet_size}</p>}
              </div>
              <div>
                <Label htmlFor={`${id}-vehicle`}>{t("fieldVehicle")}</Label>
                <select id={`${id}-vehicle`} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} className={`${selectCls} mt-1.5`}>
                  <option value="">{t("optional")}</option>
                  {VEHICLE.map((v) => <option key={v} value={v}>{t(`vehicle.${v}`)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`${id}-company`}>{t("fieldCompany")}</Label>
                <Input id={`${id}-company`} autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <Turnstile ref={turnstile} action="buyers_pack" onVerify={setToken} onExpire={() => setToken("")} />
                <button type="submit" disabled={state === "sending"} className="q-btn w-full justify-center bg-ink text-paper hover:bg-black disabled:opacity-60">
                  {state === "sending" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
                  {state === "sending" ? t("sending") : t("submit")}
                </button>
                {state === "error" && <p role="alert" className="mt-3 t-small text-alert-ink">{t("error")}</p>}
                <p className="mt-3 t-small text-ink-muted">{t("privacy")}</p>
              </div>
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
}
