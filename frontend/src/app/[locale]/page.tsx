import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Section, Container, Label, Heading, Text, TextLink,
} from "@/components/system";
import { ContactBand, CredentialGroups } from "@/components/system/blocks";
import { CinematicHero, ImageBand, Mosaic } from "@/components/system/imagery";
import { EvidenceStory } from "@/components/sections/EvidenceStory";
import { BusinessDoors } from "@/components/system/doors";
import { getBlogPosts } from "@/lib/api";
import { CONTACT_ADDRESS, COMPANY_REG_NO } from "@/lib/constants";
import type { BlogPost } from "@/types";

/* ─── Homepage — Quiet Authority ──────────────────────────────────────────────
   Rebuilt October 2026. The old page ran nine sections on one formula — a gold
   eyebrow, a headline split black-then-gold, a fade-in, a rounded card — over
   aurora glows and film grain, behind an auto-rotating hero. It read as a
   premium template rather than a company.

   This page has one job per section, in the order a buyer needs them:
     1. Who we are — a stable statement, over our real head office.
     2. Four doors — each business, and the one thing a client does next.
     3. The evidence — the measured FET result, stated with its limits.
     4. Credentials — separated by what each one actually covers.
     5. The company — registration, people, address.
     6. News — real launch photography until posts are published.
     7. Contact — a brief, a call or a message, no detour.

   Only real photographs appear, each captioned.                              */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return { title: { absolute: t("title") }, description: t("description") };
}

export default async function HomePage() {
  const t = await getTranslations("homeQA");
  const alt = await getTranslations("imageAlt");
  const locale = await getLocale();

  let posts: BlogPost[] = [];
  try {
    posts = (await getBlogPosts(1, locale)).data.slice(0, 3);
  } catch {
    posts = []; // backend unreachable — the news block falls back to press photos
  }

  const evidenceRows: [string, string][] = [
    [t("evidenceRowBefore"), `11.52 ${t("evidenceUnit")}`],
    [t("evidenceRowAfter"), `9.92 ${t("evidenceUnit")}`],
    [t("evidenceRowNoise"), "± 3–5%"],
  ];

  const credentials = [
    {
      group: t("credGroupProduct"),
      items: [
        { name: "CTI GmbH", what: t("credCti") },
        { name: "AVL Technologies", what: t("credAvl") },
        { name: "qm-solutions GmbH", what: t("credQm") },
      ],
    },
    {
      group: t("credGroupCompany"),
      items: [
        { name: "ISO 9001:2015", what: t("credIso9001") },
        { name: "ISO 14001:2015", what: t("credIso14001") },
        { name: "ISO 27001", what: t("credIso27001") },
        { name: "Zurich Insurance", what: t("credZurich") },
      ],
    },
  ];

  /* Until the team publishes articles, the news row shows real launch and
     field photography rather than invented headlines. */
  const fallbackNews = [
    { tag: t("newsLaunchTag"), title: t("newsLaunchTitle"), caption: t("newsLaunchCaption"), image: "/press/launch-team.jpg", href: "/products/fuel-eco-tech", external: false },
    {
      tag: t("newsPressTag"), title: t("newsPressTitle"), caption: t("newsPressCaption"), image: "/press/launch-presenters.jpg",
      href: "https://www.ugnewsline.com/german-fuel-saving-technology-launches-in-uganda-as-motorists-seek-relief-from-rising-fuel-costs/",
      external: true,
    },
    { tag: t("newsFieldTag"), title: t("newsFieldTitle"), caption: t("newsFieldCaption"), image: "/products/fet/field-in-hand.jpg", href: "/products/fuel-eco-tech", external: false },
  ];

  const dateFmt = new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">

        {/* ══ 1 · Opening ═══════════════════════════════════════════════════ */}
        <CinematicHero
          image="/images/stock/kampala-skyline.jpg"
          alt={alt("kampala")}
          label={t("openLabel")}
          lines={[t("openTitle1"), t("openTitle2")]}
          lead={t("openLead")}
          primary={{ label: t("openCta"), href: "/enquire" }}
          secondary={{ label: t("openSecondary"), href: "/about" }}
          credit={t("heroCredit")}
          scrollCue={t("scrollCue")}
        />

        {/* ══ 2 · Four doors — each shows the photograph its page opens on ═ */}
        <Section tone="paper" aria-labelledby="doors-heading">
          <h2 id="doors-heading" className="sr-only">{t("doorsHeading")}</h2>
          <Container>
            <BusinessDoors />
          </Container>
        </Section>

        <ImageBand image="/images/stock/hills-road.jpg" alt={alt("hillsRoad")} statement={t("bandStatement")} />

        {/* ══ 3 · Evidence — a pinned chapter: the device turns and opens as
               the measured result builds up beside it ══════════════════════ */}
        <EvidenceStory
          label={t("evidenceLabel")}
          before={{ k: t("evidenceRowBefore"), v: "11.52" }}
          after={{ k: t("evidenceRowAfter"), v: "9.92" }}
          unit={t("evidenceUnit")}
          noise={{ k: evidenceRows[2][0], v: evidenceRows[2][1] }}
          figureCaption={t("evidenceFigureCaption")}
          source={t("evidenceSource")}
          honest={t("evidenceHonest")}
          illustration={t("deviceIllustration")}
          deviceAlt={t("deviceAlt")}
          links={[
            { label: t("evidenceLinkCalc"), href: "/products/fuel-eco-tech#fet-calculator" },
            { label: t("evidenceLinkProduct"), href: "/products/fuel-eco-tech" },
          ]}
        />

        {/* ══ 4 · Credentials, separated ════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="cred-heading">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Label className="mb-6">{t("credLabel")}</Label>
              <Heading id="cred-heading" size="h2" className="text-ink">{t("credTitle")}</Heading>
              <Text className="mt-6">{t("credBody")}</Text>
              <div className="mt-8">
                <TextLink href="/trust/certifications">{t("credCta")}</TextLink>
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-10">
              <div className="md:col-span-2">
                <CredentialGroups groups={credentials.map((g) => ({ title: g.group, items: g.items }))} />
              </div>
              <Text size="small" muted className="md:col-span-2 -mt-4">{t("credNote")}</Text>
            </div>
          </Container>
        </Section>

        {/* ══ 5 · The company ═══════════════════════════════════════════════ */}
        <Section tone="deep" aria-labelledby="company-heading">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 lg:order-2">
              <Mosaic
                a={{ src: "/hero/about-hq.jpg", alt: alt("hq"), caption: CONTACT_ADDRESS.join(", ") }}
                b={{ src: "/hero/brand-wall.jpg", alt: alt("reception"), caption: t("companyPhotoCaption") }}
              />
            </div>
            <div className="lg:col-span-5 lg:order-1">
              <Label className="mb-6">{t("companyLabel")}</Label>
              <Heading id="company-heading" size="h2" className="text-ink">{t("companyTitle")}</Heading>
              <Text className="mt-6 max-w-[34rem]">{t("companyBody", { reg: COMPANY_REG_NO })}</Text>
              <div className="mt-8">
                <TextLink href="/about">{t("companyCta")}</TextLink>
              </div>
            </div>
          </Container>
        </Section>

        {/* ══ 6 · News ══════════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="news-heading">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
              <div>
                <Label className="mb-6">{t("newsLabel")}</Label>
                <Heading id="news-heading" size="h2" className="text-ink">{t("newsTitle")}</Heading>
              </div>
              <TextLink href="/blog">{t("newsAll")}</TextLink>
            </div>

            {posts.length > 0 ? (
              <ol className="border-t border-line-strong">
                {posts.map((p) => (
                  <li key={p.id} className="border-b border-line">
                    <Link href={`/blog/${p.slug}`} className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-8 py-7">
                      <time dateTime={p.published_at} className="t-small text-ink-muted md:col-span-3 font-numeric">
                        {dateFmt.format(new Date(p.published_at))}
                      </time>
                      <span className="md:col-span-8">
                        <span className="t-h3 block text-ink group-hover:text-gold-ink transition-colors">{p.title}</span>
                        {p.excerpt && <span className="t-small block text-ink-muted mt-2 max-w-[42rem]">{p.excerpt}</span>}
                      </span>
                      <ArrowUpRight aria-hidden="true" className="hidden md:block md:col-span-1 justify-self-end h-4 w-4 text-ink-muted mt-2" />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                {fallbackNews.map((n) => {
                  const body = (
                    <>
                      <div className="relative overflow-hidden rounded-frame bg-paper-deep q-unveil q-zoom" style={{ aspectRatio: "4/3" }}>
                        <div className="q-inner absolute inset-0"><Image
                          src={n.image}
                          alt={n.caption}
                          fill
                          sizes="(min-width: 768px) 30vw, 100vw"
                          className="object-cover"
                        /></div>
                      </div>
                      <p className="t-label text-ink-muted mt-5">{n.tag}</p>
                      <p className="t-h3 text-ink mt-2 group-hover:text-gold-ink transition-colors">{n.title}</p>
                    </>
                  );
                  return (
                    <li key={n.title}>
                      {n.external ? (
                        <a href={n.href} target="_blank" rel="noopener noreferrer" className="group block">{body}</a>
                      ) : (
                        <Link href={n.href} className="group block">{body}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Container>
        </Section>

        {/* ══ 7 · Contact ═══════════════════════════════════════════════════ */}
        <ContactBand
          title={t("closeTitle")}
          body={t("closeBody")}
          briefLabel={t("closeBrief")}
          labels={{ call: t("closeCall"), email: t("closeEmail"), visit: t("closeVisit"), whatsapp: t("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
