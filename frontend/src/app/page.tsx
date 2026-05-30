import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Fuel,
  HeartPulse,
  Coffee,
  Truck,
  ArrowRight,
  ShieldCheck,
  Globe,
  Lightbulb,
} from "lucide-react";

const products = [
  {
    icon: Fuel,
    label: "Fuel Eco Tech",
    badge: "B2B",
    tagline: "Proven fuel-saving technology for commercial fleets.",
    description:
      "Reduce fuel consumption, lower operating costs, and extend engine life. Trusted by fleet managers across East Africa.",
    href: "/products/fuel-eco-tech",
    cta: "Request a Fuel Savings Assessment",
  },
  {
    icon: HeartPulse,
    label: "SEAL Wound Spray",
    badge: "Medical",
    tagline: "Fast, effective hemostatic wound control.",
    description:
      "Clinically validated emergency bleeding control for hospitals, clinics, NGOs, and first responders.",
    href: "/products/seal-wound-spray",
    cta: "Request Product Information",
  },
  {
    icon: Coffee,
    label: "Vitorra Coffee",
    badge: "Shop Now",
    tagline: "Premium Ugandan coffee for discerning buyers.",
    description:
      "Traceable, responsibly sourced Ugandan coffee for consumers, hospitality businesses, and international importers.",
    href: "/products/coffee",
    cta: "Shop Coffee",
  },
  {
    icon: Truck,
    label: "Logistics Services",
    badge: "B2B",
    tagline: "End-to-end freight and supply chain solutions.",
    description:
      "Road freight, shipping & forwarding, warehousing, customs support, and supply chain management across East Africa and beyond.",
    href: "/products/logistics",
    cta: "Request a Logistics Quote",
  },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: "Trust",
    description:
      "Verified products, transparent operations, and professional service delivery that instils confidence at every touchpoint.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Forward-thinking solutions — from fuel-saving technology to hemostatic medical products — that move industries forward.",
  },
  {
    icon: Globe,
    title: "Opportunity",
    description:
      "Connecting Ugandan and East African businesses to world-class products and the global markets they deserve.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-dark pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-widest text-gold mb-6">
                Vitorra Holdings Limited
              </p>
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-8">
                Innovative products.{" "}
                <span className="text-gold-gradient">Dependable solutions.</span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
                A diversified distribution and management company delivering Fuel
                Eco Tech, logistics, healthcare products, and premium coffee
                across Uganda and East Africa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <LinkButton
                  href="/enquire"
                  size="lg"
                  className="bg-gold text-charcoal hover:bg-gold-light font-medium px-8"
                >
                  Request a Quote
                </LinkButton>
                <LinkButton
                  href="/about"
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  About Vitorra
                </LinkButton>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-gold py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-2 text-charcoal text-sm font-medium">
            <span>Uganda · East Africa · International</span>
            <span className="hidden sm:block text-charcoal/30">|</span>
            <span>4 Product Lines</span>
            <span className="hidden sm:block text-charcoal/30">|</span>
            <span>Verified Certifications</span>
            <span className="hidden sm:block text-charcoal/30">|</span>
            <span>B2B &amp; B2C</span>
          </div>
        </section>

        {/* Products */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <p className="text-xs uppercase tracking-widest text-gold mb-3">
                Our Portfolio
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal gold-underline">
                What we offer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) => {
                const Icon = product.icon;
                return (
                  <div
                    key={product.label}
                    className="group border border-border rounded-lg p-8 hover:border-gold/40 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {product.badge}
                      </Badge>
                    </div>
                    <h3 className="font-serif text-xl text-charcoal mb-2">
                      {product.label}
                    </h3>
                    <p className="text-sm font-medium text-gold mb-3">
                      {product.tagline}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {product.description}
                    </p>
                    <Link
                      href={product.href}
                      className="inline-flex items-center gap-2 text-sm font-medium text-charcoal group-hover:text-gold transition-colors"
                    >
                      {product.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Vitorra */}
        <section className="section-padding bg-ivory">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14 text-center">
              <p className="text-xs uppercase tracking-widest text-gold mb-3">
                Why Vitorra
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal max-w-2xl mx-auto leading-tight">
                Built on trust. Driven by innovation. Defined by opportunity.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="text-center">
                    <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="font-serif text-xl text-charcoal mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="section-padding-sm bg-charcoal">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs uppercase tracking-widest text-gold mb-8">
              Certifications &amp; Validations
            </p>
            <p className="text-white/60 text-sm max-w-xl mx-auto mb-8">
              All Vitorra products are supported by verified certifications,
              lab results, and third-party validations. Available on request.
            </p>
            <LinkButton
              href="/trust/certifications"
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 hover:text-gold"
            >
              View Certifications &amp; Trust Documents
            </LinkButton>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="bg-hero-dark rounded-2xl px-8 md:px-16 py-16 text-center">
              <p className="text-xs uppercase tracking-widest text-gold mb-4">
                Get Started
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-5 leading-tight">
                Ready to work with Vitorra?
              </h2>
              <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-10">
                Whether you need a fuel savings assessment, a logistics quote, or
                want to stock premium Ugandan coffee — our team responds within
                24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LinkButton
                  href="/enquire"
                  size="lg"
                  className="bg-gold text-charcoal hover:bg-gold-light font-medium px-10"
                >
                  Request a Quote
                </LinkButton>
                <LinkButton
                  href="/contact"
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Contact Us
                </LinkButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
