import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/* ─── Team teaser ─────────────────────────────────────────────────────────────
   Slim homepage band: overlapping portrait avatars that spread apart on hover
   (each lifts + gold ring + name tooltip) beside a short line and a CTA to the
   full team on /about. Keeps the homepage short while still showing the faces.
   ─────────────────────────────────────────────────────────────────────────── */

const avatars = [
  { name: "Solomon Okello",    role: "Chief Executive Officer",   file: "Solomon Okello - CEO.jpg" },
  { name: "Victor Lojum",      role: "Head of Operations",        file: "Victor Lojum - Head of Operations.jpg" },
  { name: "Joseph Rwabu",      role: "Senior Finance Officer",    file: "Joseph Rwabu - Senior Finance Officer.jpeg" },
  { name: "Thurayya Nakayima", role: "Senior Marketing Officer",  file: "Thurayya Nakayima - Senior Marketing Officer.jpg" },
  { name: "John Oluwaseyi",    role: "IT Officer",                file: "John Oluwaseyi - IT Officer.jpeg" },
  { name: "Sarah Nuwamanya",   role: "Marketing Officer",         file: "Sarah Nuwamanya - Marketing Officer.jpg" },
  { name: "Olivia Sandra",     role: "Brand Designer",            file: "Olivia Sandra - Brand Designer.jpeg" },
  { name: "Daniel Tuke",       role: "Finance Officer",           file: "Daniel Tuke - Finance Officer.jpeg" },
  { name: "Nagawa Shakirah",   role: "Marketing Officer",         file: "Nagawa Shakirah - Marketing Officer.jpeg" },
];

export default function TeamTeaser() {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-20 px-6 md:px-12 lg:px-20"
      style={{ backgroundColor: "#F8F7F5" }}
    >
      <Reveal className="container-max">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-20">
          {/* Avatar stack */}
          <div className="av-stack group flex items-center shrink-0">
            {avatars.map((m, i) => (
              <div
                key={m.file}
                className={cn(
                  "av-item relative transition-all duration-500",
                  i > 0 && "-ml-6 sm:-ml-5 group-hover:ml-1.5"
                )}
                style={{ zIndex: avatars.length - i }}
              >
                <div className="av-photo relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-full overflow-hidden">
                  <Image
                    src={`/team/${encodeURIComponent(m.file)}`}
                    alt={m.name}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
                {/* Name tooltip */}
                <div className="av-tip" aria-hidden="true">
                  <span className="block font-semibold" style={{ color: "#FFFFFF" }}>{m.name}</span>
                  <span className="block" style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px" }}>{m.role}</span>
                </div>
              </div>
            ))}

            {/* "Meet the team" arrow chip */}
            <Link
              href="/about"
              className="av-item relative -ml-6 sm:-ml-5 group-hover:ml-1.5 transition-all duration-500 flex items-center justify-center w-16 h-16 md:w-[72px] md:h-[72px] rounded-full"
              style={{
                zIndex: 0,
                background: "#C5B27A",
                color: "#1E1E1E",
                boxShadow: "0 0 0 4px #F8F7F5, 0 6px 18px rgba(0,0,0,0.12)",
              }}
              aria-label="Meet the full team"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Text */}
          <div>
            <span className="eyebrow block mb-3">Our People</span>
            <h2
              className="mb-4 max-w-md"
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(26px, 3vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                color: "#1E1E1E",
              }}
            >
              The people behind Vitorra.
            </h2>
            <p className="mb-6 max-w-md" style={{ fontSize: "16px", lineHeight: 1.7, color: "#555555" }}>
              A company is only as strong as its people — led by Solomon Okello,
              with a team spanning operations, finance, marketing, and technology.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-60 transition-opacity group"
              style={{ color: "#1E1E1E" }}
            >
              Meet the team
              <ArrowRight className="w-4 h-4 arrow-nudge" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
