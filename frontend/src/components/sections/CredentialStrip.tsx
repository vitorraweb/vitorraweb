import { Link } from "@/i18n/navigation";
import { Container } from "@/components/system";

/* ─── Credentials strip ───────────────────────────────────────────────────────
   The names behind the products, set in type rather than logos (no marks are
   reproduced without the owners' permission), in one quiet row under the
   homepage opening, like an agency's client strip. Links to the page that
   says what each one covers. */

const NAMES = ["CTI GmbH", "AVL Technologies", "qm-solutions GmbH", "ISO 9001:2015", "ISO 14001:2015", "ISO 27001", "Zurich Insurance"];

export function CredentialStrip({ label, linkLabel }: { label: string; linkLabel: string }) {
  return (
    <section aria-label={label} className="q-scope bg-paper border-b border-line">
      <Container className="py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
          <p className="t-label text-ink-muted shrink-0">{label}</p>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-4 flex-1">
            {NAMES.map((n) => (
              <li key={n} className="font-display text-[1.25rem] lg:text-[1.4rem] text-ink-muted transition-colors duration-500 hover:text-ink">{n}</li>
            ))}
          </ul>
          <Link href="/trust/certifications" className="q-link t-small text-ink shrink-0">{linkLabel}</Link>
        </div>
      </Container>
    </section>
  );
}
