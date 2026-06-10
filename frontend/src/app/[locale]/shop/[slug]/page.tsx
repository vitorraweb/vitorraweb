import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import AddToCart from "@/components/shop/AddToCart";
import { getShopProduct, getShopProducts } from "@/lib/coffee-catalog";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";
import { ArrowLeft, ArrowRight, QrCode, Truck, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) return { title: "Coffee | Vitorra Shop" };
  return {
    title: `${product.name}, ${product.weight} | Vitorra Coffee Shop`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // Retail store gated until prices are confirmed — no product pages yet.
  if (!COFFEE_SHOP_ENABLED) redirect("/shop");

  const { slug } = await params;
  const product = await getShopProduct(slug);
  if (!product) notFound();

  const { products } = await getShopProducts();
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  const specs: [string, string][] = [
    ["Roast", `${product.roast} · 100% Arabica`],
    ["Origin", product.origin],
    ["Tasting notes", product.notes],
    ["Format", `${product.weight} · Roasted in Uganda`],
    ["Process", "Washed & Sun Dried"],
  ];

  const assurances = [
    { icon: QrCode, label: "Traceable, farm to cup" },
    { icon: Truck, label: "Kampala & nationwide delivery" },
    { icon: ShieldCheck, label: "Roasted fresh at origin" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ PRODUCT ═════════════════════════════════════════════════════════ */}
        <section className="pt-28 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 lg:px-20" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="container-max">
            {/* Breadcrumb */}
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors hover:text-[#7A6020]"
              style={{ color: "#666666" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to the shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* ── Gallery ───────────────────────────────────────────────── */}
              <Reveal direction="right">
                <div
                  className="relative rounded-[32px] overflow-hidden shadow-card"
                  style={{ aspectRatio: "4/5", backgroundColor: "#F4F1EB" }}
                >
                  <Image
                    src={product.images[0]}
                    alt={`${product.name}, ${product.weight}`}
                    fill priority sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {product.badge && (
                    <span
                      className="absolute top-5 left-5 text-[11px] font-bold uppercase tracking-[0.1em] px-3.5 py-1.5 rounded-full"
                      style={{ background: "rgba(30,30,30,0.85)", color: "#D4C49A" }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                {product.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {product.images.slice(1, 4).map((src) => (
                      <div
                        key={src}
                        className="relative rounded-[18px] overflow-hidden"
                        style={{ aspectRatio: "1/1", backgroundColor: "#F4F1EB" }}
                      >
                        <Image
                          src={src}
                          alt={`${product.name} detail`}
                          fill sizes="(max-width: 1024px) 33vw, 16vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>

              {/* ── Info + buy box ────────────────────────────────────────── */}
              <Reveal delay={120}>
                <span className="eyebrow block mb-3">Vitorra Coffee</span>
                <h1
                  className="mb-2"
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                    color: "#1E1E1E",
                  }}
                >
                  {product.name}
                </h1>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] mb-5" style={{ color: "#999999" }}>
                  {product.tagline}
                </p>
                <p className="mb-8" style={{ fontSize: "15.5px", lineHeight: 1.78, color: "#555555" }}>
                  {product.description}
                </p>

                {/* Buy box */}
                <div
                  className="rounded-[24px] p-6 md:p-7 mb-8"
                  style={{ background: "#FAF8F4", border: "1px solid rgba(197,178,122,0.18)" }}
                >
                  <AddToCart product={product} />
                </div>

                {/* Assurances */}
                <ul className="space-y-2.5">
                  {assurances.map((a) => (
                    <li key={a.label} className="flex items-center gap-3 text-sm" style={{ color: "#555555" }}>
                      <a.icon className="w-4 h-4 shrink-0" style={{ color: "#7A6020" }} />
                      {a.label}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ SPECS ═══════════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.7fr_1.3fr] gap-10 lg:gap-16">
            <Reveal>
              <span className="eyebrow block mb-3">The detail</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(26px, 3vw, 42px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  color: "#1E1E1E",
                  maxWidth: "300px",
                }}
              >
                What&apos;s in the bag.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <dl className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-6 py-3.5 border-b"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.12em] shrink-0" style={{ color: "#999999" }}>
                      {k}
                    </dt>
                    <dd className="text-sm text-right font-medium" style={{ color: "#1E1E1E" }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ══ RELATED ═════════════════════════════════════════════════════════ */}
        {related.length > 0 && (
          <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="container-max">
              <Reveal className="mb-10">
                <span className="eyebrow block mb-3">More from the shop</span>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "clamp(24px, 3vw, 40px)",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    color: "#1E1E1E",
                  }}
                >
                  You may also like.
                </h2>
              </Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p, i) => (
                  <Reveal key={p.slug} delay={i * 80}>
                    <Link
                      href={`/shop/${p.slug}`}
                      className="glow-card group rounded-[24px] overflow-hidden h-full flex flex-col"
                      style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)", border: "1px solid rgba(197,178,122,0.16)" }}
                    >
                      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "#F4F1EB" }}>
                        <Image
                          src={p.images[0]}
                          alt={`${p.name}, ${p.weight}`}
                          fill sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="p-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>
                            {p.name}
                          </h3>
                          <p className="text-xs" style={{ color: "#999999" }}>{p.tagline}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 arrow-nudge" style={{ color: "#7A6020" }} />
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <FinalCTA
          eyebrow="Vitorra Coffee"
          titleLead="Brewed in"
          titleAccent="Uganda."
          body="Single-origin GOLD, roasted at origin and delivered to your door. Buying for a business? Ask us about wholesale and export."
          primaryLabel="Enquire: Wholesale & Export"
          primaryHref="/enquire?sector=COFFEE"
          secondaryLabel="Back to the shop"
          secondaryHref="/shop"
          caption="Single origin · Traceable · Roasted in Uganda"
        />

      </main>
      <Footer />
    </>
  );
}
