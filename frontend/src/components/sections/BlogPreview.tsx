import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { getBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/types";

/* ─── Blog preview — homepage section ────────────────────────────────────────
   Server component: fetches the 3 most recent published posts.
   Falls back gracefully when the backend is not yet live, showing three
   editorial placeholder cards so the homepage never looks unfinished.
   ─────────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ── Live post card (rendered when backend is running) ───────────────────── */
function PostCard({ post, index, readLabel }: { post: BlogPost; index: number; readLabel: string }) {
  return (
    <Reveal delay={index * 80}>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col bg-white rounded-[24px] overflow-hidden h-full glow-card"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #161616 0%, #2A2A2A 100%)" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "64px", fontWeight: 700,
                  color: "rgba(197,178,122,0.18)",
                }}
              >
                V
              </span>
            </div>
          )}
          {post.published_at && (
            <span
              className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", color: "#1E1E1E",
              }}
            >
              <Calendar className="w-3 h-3" style={{ color: "#C5B27A" }} />
              {formatDate(post.published_at)}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 p-6">
          <h3
            className="mb-2"
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "19px", fontWeight: 600,
              letterSpacing: "-0.01em", lineHeight: 1.3, color: "#1E1E1E",
            }}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="flex-1 mb-4" style={{ fontSize: "13px", lineHeight: 1.72, color: "#777777" }}>
              {post.excerpt.length > 110 ? post.excerpt.slice(0, 110) + "…" : post.excerpt}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto" style={{ color: "#1E1E1E" }}>
            {readLabel} <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/* ── Feature cards (shown until the blog CMS has live posts) ──────────────────
   Currently the June 2026 Fuel Eco Tech launch press conference, with real
   event photos. Each card links to a relevant destination (the FET pages or the
   press coverage). The moment real blog posts are published, the live PostCards
   above take over automatically. */
type Feature = {
  tag: string; title: string; body: string; cta: string;
  image: string; href: string; external?: boolean;
};

function FeatureCard({ item, index }: { item: Feature; index: number }) {
  const inner = (
    <>
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            fontSize: "10px", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: "#7A6020",
          }}
        >
          {item.tag}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-6">
        <h3
          className="mb-2"
          style={{
            fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "19px", fontWeight: 600,
            letterSpacing: "-0.01em", lineHeight: 1.3, color: "#1E1E1E",
          }}
        >
          {item.title}
        </h3>
        <p className="flex-1 mb-4" style={{ fontSize: "13px", lineHeight: 1.72, color: "#777777" }}>
          {item.body}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto" style={{ color: "#1E1E1E" }}>
          {item.cta} <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
        </span>
      </div>
    </>
  );

  const cls = "group flex flex-col bg-white rounded-[24px] overflow-hidden h-full glow-card";
  const style = { border: "1px solid rgba(0,0,0,0.06)" } as const;

  return (
    <Reveal delay={index * 80}>
      {item.external ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{inner}</a>
      ) : (
        <Link href={item.href} className={cls} style={style}>{inner}</Link>
      )}
    </Reveal>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export default async function BlogPreview() {
  const t = await getTranslations("blogPreview");
  let posts: BlogPost[] = [];
  try {
    const res = await getBlogPosts(1);
    posts = res.data.slice(0, 3);
  } catch {
    posts = [];
  }

  const UGNEWS = "https://www.ugnewsline.com/german-fuel-saving-technology-launches-in-uganda-as-motorists-seek-relief-from-rising-fuel-costs/";
  const features: Feature[] = [
    { tag: t("placeholder1Tag"), title: t("placeholder1Title"), body: t("placeholder1Body"), cta: t("placeholder1Cta"), image: "/press/launch-team.jpg",         href: "/products/fuel-eco-tech" },
    { tag: t("placeholder2Tag"), title: t("placeholder2Title"), body: t("placeholder2Body"), cta: t("placeholder2Cta"), image: "/press/launch-presenters.jpg",   href: "/enquire?sector=FET" },
    { tag: t("placeholder3Tag"), title: t("placeholder3Title"), body: t("placeholder3Body"), cta: t("placeholder3Cta"), image: "/press/launch-presentation.jpg", href: UGNEWS, external: true },
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="container-max">
        {/* Header row */}
        <Reveal className="mb-12 lg:mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
            <div>
              <span className="eyebrow block mb-3">{t("eyebrow")}</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(28px, 3.2vw, 44px)",
                  fontWeight: 700, letterSpacing: "-0.02em",
                  lineHeight: 1.12, color: "#1E1E1E",
                }}
              >
                {t("title")}
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 pb-1"
              style={{ color: "#7A6020" }}
            >
              {t("viewAll")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.length > 0
            ? posts.map((p, i) => <PostCard key={p.id} post={p} index={i} readLabel={t("readArticle")} />)
            : features.map((f, i) => <FeatureCard key={f.title} item={f} index={i} />)
          }
        </div>
      </div>
    </section>
  );
}
