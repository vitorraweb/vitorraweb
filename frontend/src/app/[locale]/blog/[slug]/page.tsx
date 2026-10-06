import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Container } from "@/components/system";
import { ContactBand } from "@/components/system/blocks";
import { getBlogPost } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

/* ─── Article — Quiet Authority ───────────────────────────────────────────────
   Title first, in the display serif; the cover as a wide editorial figure
   beneath it; then the prose at a reading measure (.blog-content). Content is
   authored in the CMS as Markdown and sanitised server-side.               */

interface Props { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const post = await getBlogPost(slug, locale);
    const title = post.seo_title ?? post.title;
    const description = post.seo_description ?? post.excerpt ?? undefined;
    const path = `${locale === "en" ? "" : `/${locale}`}/blog/${post.slug}`;
    return {
      title,
      description,
      alternates: {
        canonical: path,
        languages: { en: `/blog/${post.slug}`, sw: `/sw/blog/${post.slug}`, "x-default": `/blog/${post.slug}` },
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: path,
        publishedTime: post.published_at ?? undefined,
        images: post.cover_image ? [{ url: post.cover_image }] : undefined,
      },
      twitter: { card: "summary_large_image", title, description, images: post.cover_image ? [post.cover_image] : undefined },
    };
  } catch {
    const t = await getTranslations({ locale, namespace: "meta.article" });
    return { title: t("title") };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("blogPage");
  const home = await getTranslations("homeQA");
  const fmt = new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  let post;
  try {
    post = await getBlogPost(slug, locale);
  } catch {
    notFound();
  }

  /* Article structured data, so search engines can show the post as an
     article (headline, date, publisher) rather than a plain link. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    image: post.cover_image ? [new URL(post.cover_image, SITE_URL).toString()] : undefined,
    mainEntityOfPage: `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/blog/${post.slug}`,
    inLanguage: locale,
    author: { "@type": "Organization", name: "Vitorra Holdings Limited", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Vitorra Holdings Limited", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <article className="q-scope">
          <Container className="pt-12 lg:pt-20">
            <Link href="/blog" className="q-link t-small text-ink-muted">
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              {t("backToBlog")}
            </Link>
            <header className="mt-12 max-w-[52rem]">
              <p className="t-label text-ink-muted flex flex-wrap gap-x-3 q-rise">
                {post.published_at && <time dateTime={post.published_at} className="font-numeric">{fmt.format(new Date(post.published_at))}</time>}
                {post.author && <span>· {post.author}</span>}
              </p>
              <h1 className="t-display text-ink mt-6 q-rise" style={{ "--d": "120ms" } as React.CSSProperties}>{post.title}</h1>
              {post.excerpt && <p className="t-lead text-ink-soft mt-8 max-w-[40rem] q-rise" style={{ "--d": "240ms" } as React.CSSProperties}>{post.excerpt}</p>}
            </header>
          </Container>

          {post.cover_image && (
            <Container className="mt-14">
              <div className="relative overflow-hidden rounded-frame bg-paper-deep q-unveil" style={{ aspectRatio: "16/8" }}>
                <div className="q-inner absolute inset-0">
                  <Image src={post.cover_image} alt={post.title} fill priority sizes="100vw" className="object-cover" />
                </div>
              </div>
            </Container>
          )}

          <Container className="py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div
                className="blog-content lg:col-start-3 lg:col-span-8"
                /* content_html is sanitised server-side (markdown → safe HTML). */
                dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
              />
            </div>
          </Container>
        </article>

        <ContactBand
          title={`${t("finalCtaTitleLead")} ${t("finalCtaTitleAccent")}`}
          body={t("finalCtaBody")}
          briefLabel={t("finalCtaPrimary")}
          briefHref="/contact"
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
