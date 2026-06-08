import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { getBlogPost } from "@/lib/api";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getBlogPost(slug);
    return {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
    };
  } catch {
    return { title: "Article — Vitorra Holdings" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getBlogPost(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* Cover image */}
        {post.cover_image && (
          <div className="relative w-full overflow-hidden" style={{ minHeight: "56vh" }}>
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 18s ease-out both" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, #F2F2F2 100%)" }} />
          </div>
        )}

        <article
          className="px-6 md:px-12 lg:px-20 pb-8"
          style={{ paddingTop: post.cover_image ? "0" : "clamp(128px, 12vh, 168px)" }}
        >
          <div className="container-max max-w-3xl">

            {/* Back link */}
            <Reveal className={post.cover_image ? "pt-10 mb-8" : "mb-8"}>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-60 transition-opacity"
                style={{ color: "#666666" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Blog & Insights
              </Link>
            </Reveal>

            {/* Meta */}
            <Reveal className="mb-6">
              <div className="flex flex-wrap items-center gap-4 mb-5">
                {post.published_at && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: "#999999" }}>
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "#999999" }}>
                  <User className="w-3.5 h-3.5" />
                  {post.author}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(30px, 4.5vw, 52px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.08,
                  color: "#1E1E1E",
                }}
              >
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-5 text-lg" style={{ lineHeight: 1.7, color: "#555555" }}>
                  {post.excerpt}
                </p>
              )}
            </Reveal>

            <div className="h-px my-8" style={{ background: "rgba(0,0,0,0.08)" }} />

            {/* Content */}
            <Reveal>
              <div
                className="blog-content"
                /* content_html is sanitised server-side (markdown → safe HTML). */
                dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }}
              />
            </Reveal>
          </div>
        </article>

        <FinalCTA
          titleLead="Questions about what"
          titleAccent="you just read?"
          body="Our team is happy to go deeper — reach out and we'll respond within 24 hours."
          primaryLabel="Get in Touch"
          primaryHref="/contact"
          secondaryLabel="Request a Quote"
          secondaryHref="/enquire"
          caption="Uganda · East Africa · International"
        />

      </main>
      <Footer />
    </>
  );
}
