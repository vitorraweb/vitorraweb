import type { Metadata } from "next";
import { API_BASE_URL as API, SITE_URL } from "@/lib/constants";
import { ldJson } from "@/lib/seo";

/* A role page sits in the page column, clear of the fixed site header, and
   carries JobPosting data so the role can appear in Google's job listings.
   (The page itself is a client form; the facts are fetched here, on the
   server, so crawlers see them in the HTML.)                              */

type Opening = {
  title: string; slug: string; department: string | null; location: string | null;
  employment_type: string; description: string | null; closes_at: string | null; posted_at?: string | null;
};

const TYPES: Record<string, string> = { full_time: "FULL_TIME", part_time: "PART_TIME", contract: "CONTRACTOR", internship: "INTERN" };

async function getOpening(slug: string): Promise<Opening | null> {
  try {
    const res = await fetch(`${API}/careers/openings/${encodeURIComponent(slug)}`, { next: { revalidate: 600 } });
    return res.ok ? ((await res.json()).data as Opening) : null;
  } catch {
    return null;
  }
}

/* A one-line summary for search results and link previews (WhatsApp,
   LinkedIn, email): the first real sentence of the description, after any
   "Job Summary" heading, cut at a word near 155 characters. */
function summary(o: Opening): string {
  const text = (o.description ?? "")
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter((l) => l && !/^(job summary|summary|about the role)\s*:?$/i.test(l))
    .join(" ");
  const fallback = `${o.title} at Vitorra Holdings, ${o.location ? "Kampala" : "Uganda"}. Apply online with your CV.`;
  if (!text) return fallback;
  return text.length <= 155 ? text : `${text.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = await getOpening(slug);
  if (!o) return { title: "Careers", robots: { index: false } };
  const title = `${o.title}: job opening`;
  const description = summary(o);
  const url = `${SITE_URL}/careers/${o.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${o.title} | Vitorra Holdings`, description, siteName: "Vitorra Holdings Limited" },
    twitter: { card: "summary_large_image", title: `${o.title} | Vitorra Holdings`, description },
  };
}

export default async function RoleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = await getOpening(slug);

  const job = o && o.description && o.posted_at
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: o.title,
        description: o.description.replace(/\n/g, "<br>"),
        datePosted: o.posted_at,
        ...(o.closes_at ? { validThrough: o.closes_at } : {}),
        employmentType: TYPES[o.employment_type] ?? "OTHER",
        hiringOrganization: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Vitorra Holdings Limited", sameAs: SITE_URL, logo: `${SITE_URL}/logo.png` },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            ...(o.location ? { streetAddress: o.location.replace(/\s+,/g, ",").replace(/,?\s*Kampala\s*$/i, "") } : {}),
            addressLocality: "Kampala",
            addressCountry: "UG",
          },
        },
        url: `${SITE_URL}/careers/${o.slug}`,
      }
    : null;

  return (
    <div className="q-container pt-32 lg:pt-44 pb-20 md:pb-28">
      {job && <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(job)} />}
      {children}
    </div>
  );
}
