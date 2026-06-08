import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { ArrowRight, Calendar, User } from "lucide-react";
import { getBlogPosts } from "@/lib/api";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Blog & Insights — Vitorra Holdings Limited",
  description:
    "Insights, updates, and stories from Vitorra Holdings — fuel technology, healthcare, premium Ugandan coffee, and logistics across East Africa.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col bg-white border border-black/[0.05] hover-lift overflow-hidden ${featured ? "rounded-[32px]" : "rounded-[24px]"}`}
    >
      {post.cover_image ? (
        <div className={`relative w-full overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes={featured ? "100vw" : "(max-width:768px) 100vw, 50vw"}
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        </div>
      ) : (
        <div
          className={`w-full flex items-center justify-center ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}
          style={{ background: "linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(40px, 8vw, 80px)",
              fontWeight: 700,
              color: "rgba(197,178,122,0.25)",
              letterSpacing: "-0.03em",
            }}
          >
            V
          </span>
        </div>
      )}

      <div className={`flex flex-col flex-1 ${featured ? "p-8 md:p-10" : "p-6 md:p-7"}`}>
        <div className="flex items-center gap-4 mb-3">
          {post.published_at && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999999" }}>
              <Calendar className="w-3 h-3" />
              {formatDate(post.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999999" }}>
            <User className="w-3 h-3" />
            {post.author}
          </span>
        </div>

        <h2
          className={`mb-3 group-hover:opacity-75 transition-opacity ${featured ? "max-w-2xl" : ""}`}
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: featured ? "clamp(24px, 2.8vw, 36px)" : "clamp(18px, 2vw, 22px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: "#1E1E1E",
          }}
        >
          {post.title}
        </h2>

        {post.excerpt && (
          <p
            className={`flex-1 mb-5 ${featured ? "max-w-xl" : ""}`}
            style={{ fontSize: "14px", lineHeight: 1.7, color: "#666666" }}
          >
            {post.excerpt}
          </p>
        )}

        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto"
          style={{ color: "#1E1E1E" }}
        >
          Read article
          <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-20 text-center">
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: "clamp(60px, 10vw, 100px)",
          fontWeight: 700,
          color: "rgba(30,30,30,0.06)",
          letterSpacing: "-0.03em",
          display: "block",
          marginBottom: "24px",
        }}
      >
        Coming soon
      </span>
      <p style={{ fontSize: "16px", color: "#666666", marginBottom: "24px" }}>
        Insights and updates are on their way.
      </p>
      <Link href="/contact" className="btn-secondary inline-flex items-center gap-2">
        Get in touch<ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  try {
    const res = await getBlogPosts(1);
    posts = res.data;
  } catch {
    // Backend not yet running — render gracefully with empty state
    posts = [];
  }

  const [featured, ...rest] = posts;

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        <section className="px-6 md:px-12 lg:px-20 pb-20 md:pb-28" style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}>
          <div className="container-max">

            {/* Header */}
            <Reveal className="mb-12 lg:mb-16">
              <span className="eyebrow block mb-3">Blog & Insights</span>
              <h1
                className="max-w-xl gold-underline"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.08,
                  color: "#1E1E1E",
                }}
              >
                Ideas &amp; insights from Vitorra.
              </h1>
            </Reveal>

            {posts.length === 0 ? (
              <div className="grid"><EmptyState /></div>
            ) : (
              <>
                {/* Featured post */}
                {featured && (
                  <Reveal className="mb-8">
                    <PostCard post={featured} featured />
                  </Reveal>
                )}

                {/* Grid of remaining posts */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((post, i) => (
                      <Reveal key={post.id} delay={i * 70}>
                        <PostCard post={post} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
