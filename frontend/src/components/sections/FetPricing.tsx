import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import ApproxPrice from "@/components/ui/ApproxPrice";
import CurrencyConverter from "@/components/ui/CurrencyConverter";
import ReserveButton from "@/components/sections/ReserveButton";
import { Section, Container, Figure, TextLink, Text } from "@/components/system";
import { SectionHead } from "@/components/system/blocks";
import { FET_TIERS, formatEur, engineSpanLabel } from "@/lib/fet-pricing";

/* ─── FET Full Line Pricing — Quiet Authority ─────────────────────────────────
   Public pricing guide, one column per device tier, with its exact selling
   price (EUR, Kampala landed + installation). Prices are shown openly; the
   sales motion stays assessment → quote, so every column also routes to the
   enquiry form. Engine spans come from the manufacturer application table via
   engineSpanLabel(), so this block can never disagree with "Which device fits".
   The model codes on the left are the manufacturer's (FET-PRO-FI…FIV).       */

const MODEL_CODE: Record<string, string> = { car: "FI", suv: "FII", lighttruck: "FIII", heavytruck: "FIV" };

export default function FetPricing() {
  const tr = useTranslations("fetPricing");
  const tt = useTranslations("fetTiers");

  const included = [tr("included1"), tr("included2"), tr("included3")];

  return (
    <Section tone="deep" id="fet-pricing" aria-labelledby="fet-pricing-heading">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-14">
          <SectionHead
            id="fet-pricing-heading"
            className="lg:col-span-7"
            label={tr("eyebrow")}
            title={<>{tr("titleLead")} {tr("titleAccent")}</>}
            body={tr("body")}
          />
          <div className="lg:col-span-4 lg:col-start-9">
            <Figure src="/products/fet/Picture3.jpg" alt={tr("deviceAlt")} ratio="1/1" sizes="(min-width: 1024px) 28vw, 100vw" />
          </div>
        </div>

        {/* Hairline grid — one column per device. */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border-y border-line">
          {FET_TIERS.map((t) => (
            <li key={t.id} className="flex flex-col bg-paper-deep py-8 sm:px-6 lg:first:pl-0">
              <p className="t-label text-gold-ink">{t.model}</p>
              <h3 className="t-h3 text-ink mt-3">{tt(`${t.id}.label`)}</h3>
              <p className="t-small text-ink-soft mt-2">{tt(`${t.id}.fits`)}</p>
              <p className="t-small text-ink-muted mt-1 font-numeric">{engineSpanLabel(MODEL_CODE[t.id])}</p>
              <p className="t-small text-ink-muted mt-1">{tr("egPrefix", { examples: tt(`${t.id}.examples`) })}</p>

              <div className="mt-auto pt-8">
                <p className="t-label text-ink-muted">{tr("from")}</p>
                <p className="font-display text-[2.5rem] leading-none text-ink mt-2 [font-variant-numeric:lining-nums_tabular-nums]">
                  {formatEur(t.priceEur)}
                </p>
                <p className="t-small text-ink-muted mt-2">{tr("perDevice")}</p>
                <ApproxPrice eur={t.priceEur} className="block t-small text-ink-muted mt-1" />

                <ReserveButton tier={t} />
                <div className="mt-3 text-center">
                  <TextLink href={`/enquire?sector=FET&vehicle=${t.id}`}>{tr("requestQuote")}</TextLink>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <ul className="space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-baseline gap-3 t-body text-ink-soft">
                  <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold translate-y-[-0.3em]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col items-start gap-4">
              {[
                { href: "/downloads/vitorra-fet-application-guide.pdf", label: tr("downloadGuide") },
                { href: "/downloads/vitorra-fet-datasheet.pdf", label: tr("downloadDatasheet") },
              ].map((d) => (
                <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="q-link t-small text-ink">
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                  {d.label}
                </a>
              ))}
            </div>
            <Text size="small" muted className="mt-8 max-w-[34rem]">{tr("footnote")}</Text>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <CurrencyConverter />
          </div>
        </div>
      </Container>
    </Section>
  );
}
