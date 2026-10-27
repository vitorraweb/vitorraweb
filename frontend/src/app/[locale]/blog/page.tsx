import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Section, Container, Text, TextLink } from "@/components/system";
import { ContactBand } from "@/components/system/blocks";
import { PageHero } from "@/components/sections/PageHero";
import { getBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/types";

/* ─── Blog — Quiet Authority ──────────────────────────────────────────────────
   The homepage's opening, then the newest story large and editorial, the
   rest in a three-column grid on cream, and the contact close.
   Posts without a cover image get a typographic tile instead of a placeholder
   logo. Dates are formatted per locale.                                     */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.blog" });
  return { title: t("title"), description: t("description") };
}

function Cover({ post, ratio, sizes }: { post: BlogPost; ratio: string; sizes: string }) {
  return (
    <div className="relative overflow-hidden rounded-frame bg-paper-deep q-unveil q-zoom" style={{ aspectRatio: ratio }}>
      {post.cover_image ? (
        <div className="q-inner absolute inset-0">
          <Image src={post.cover_image} alt={post.title} fill sizes={sizes} className="object-cover" />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-end p-6 bg-ink">
          <span className="font-display text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-tight text-ink-fg/90 line-clamp-3">{post.title}</span>
        </div>
      )}
    </div>
  );
}

function Meta({ post, date }: { post: BlogPost; date: string }) {
  return (
    <p className="t-label text-ink-muted flex flex-wrap gap-x-3">
      {date && <time dateTime={post.published_at} className="font-numeric">{date}</time>}
      {post.author && <span>· {post.author}</span>}
    </p>
  );
}

export default async function BlogPage() {
  const t = await getTranslations("blogPage");
  const home = await getTranslations("homeQA");
  const locale = await getLocale();
  const fmt = new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  let posts: BlogPost[] = [];
  try {
    posts = (await getBlogPosts(1, locale)).data;
  } catch {
    posts = [];
  }
  const [featured, ...rest] = posts;

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper">
        <PageHero id="blog-title" label={t("eyebrow")} title={t("title")} lead={t("lead")} />

        <Section tone="paper" className="!pt-0">
          <Container>
            {posts.length === 0 ? (
              <div className="py-16 max-w-[32rem]">
                <p className="t-h2 text-ink">{t("comingSoon")}</p>
                <Text className="mt-4">{t("comingSoonSub")}</Text>
                <div className="mt-8"><TextLink href="/contact">{t("getInTouch")}</TextLink></div>
              </div>
            ) : (
              featured && (
                <Link href={`/blog/${featured.slug}`} className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
                  <div className="lg:col-span-7">
                    <Cover post={featured} ratio="16/10" sizes="(min-width: 1024px) 58vw, 100vw" />
                  </div>
                  <div className="lg:col-span-5 lg:pb-4">
                    <Meta post={featured} date={featured.published_at ? fmt.format(new Date(featured.published_at)) : ""} />
                    <h2 className="t-h1 text-ink mt-5 group-hover:text-gold-ink transition-colors">{featured.title}</h2>
                    {featured.excerpt && <p className="t-lead text-ink-soft mt-5">{featured.excerpt}</p>}
                    <span className="q-link t-small text-ink mt-8">{t("readArticle")}</span>
                  </div>
                </Link>
              )
            )}
          </Container>
        </Section>

        {/* The rest of the articles, on cream, as on the homepage chapters. */}
        {rest.length > 0 && (
          <Section tone="cream">
            <Container>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {rest.map((post) => (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="group block">
                      <Cover post={post} ratio="4/3" sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" />
                      <div className="mt-6"><Meta post={post} date={post.published_at ? fmt.format(new Date(post.published_at)) : ""} /></div>
                      <h3 className="t-h3 text-ink mt-3 group-hover:text-gold-ink transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="t-small text-ink-soft mt-3 line-clamp-3">{post.excerpt}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        )}

        <ContactBand
          title={home("closeTitle")}
          body={home("closeBody")}
          briefLabel={home("closeBrief")}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
