import { getTranslations } from "next-intl/server";
import { Section, Container, Label, Heading } from "@/components/system";

/* ─── Quick answers ───────────────────────────────────────────────────────────
   The questions people actually type, each answered in one or two plain
   sentences: the shape Google's answer boxes and AI assistants lift whole.
   Each question is its own heading, so a crawler can pair it with its
   answer. The same pairs go into the page's FAQPage structured data
   (see quickAnswers()), so what machines read is what visitors see.      */

const COUNT = { home: 4, fet: 4, seal: 4, coffee: 3, logistics: 4 } as const;
export type AnswersPage = keyof typeof COUNT;

export async function quickAnswers(page: AnswersPage) {
  const t = await getTranslations("answers");
  return Array.from({ length: COUNT[page] }, (_, i) => ({ q: t(`${page}${i + 1}Q`), a: t(`${page}${i + 1}A`) }));
}

export async function QuickAnswers({ page, tone = "paper" }: { page: AnswersPage; tone?: "paper" | "cream" | "sage" | "deep" }) {
  const t = await getTranslations("answers");
  const items = await quickAnswers(page);
  return (
    <Section tone={tone} rule={tone === "paper"} aria-labelledby={`answers-${page}`}>
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Label className="mb-6">{t("label")}</Label>
          <Heading id={`answers-${page}`} size="h2" className="text-ink">{t("title")}</Heading>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 border-t border-line-strong">
          {items.map((i) => (
            <div key={i.q} className="py-7 border-b border-line">
              <h3 className="t-h3 text-ink">{i.q}</h3>
              <p className="t-body text-ink-soft mt-3">{i.a}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
