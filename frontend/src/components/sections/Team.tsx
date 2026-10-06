import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/* ─── The team — editorial portraits ──────────────────────────────────────────
   Replaces the hover-tilt "constellation" (grayscale photos, a gold orbital arc,
   a magnetic cursor). Plain portraits, a consistent crop, names in the display
   serif and roles as quiet labels: the way a serious firm introduces its
   people. CEO first, then leadership, then officers. Server component.      */

type Member = { name: string; roleKey: string; file: string };

const ceo: Member = { name: "Solomon Okello", roleKey: "ceo", file: "Solomon Okello - CEO.jpg" };
const leadership: Member[] = [
  { name: "Victor Lojum", roleKey: "headOfOperations", file: "Victor Lojum - Head of Operations.jpg" },
  { name: "Joseph Rwabu", roleKey: "seniorFinance", file: "Joseph Rwabu - Senior Finance Officer.jpeg" },
  { name: "Thurayya Nakayima", roleKey: "seniorMarketing", file: "Thurayya Nakayima - Senior Marketing Officer.jpg" },
];
const officers: Member[] = [
  { name: "Daniel Tuke", roleKey: "financeOfficer", file: "Daniel Tuke - Finance Officer.jpeg" },
  { name: "Sarah Nuwamanya", roleKey: "marketingOfficer", file: "Sarah Nuwamanya - Marketing Officer.jpg" },
  { name: "Olivia Sandra", roleKey: "brandDesigner", file: "Olivia Sandra - Brand Designer.jpeg" },
  { name: "John Oluwaseyi", roleKey: "itOfficer", file: "John Oluwaseyi - IT Officer.jpeg" },
];

function Portrait({ m, role, large = false }: { m: Member; role: string; large?: boolean }) {
  return (
    <figure className="m-0 group">
      <div className={cn("relative overflow-hidden rounded-frame bg-paper-deep q-unveil q-zoom", large ? "aspect-[4/5]" : "aspect-[3/4]")}>
        <div className="q-inner absolute inset-0">
          <Image
            src={`/team/${encodeURIComponent(m.file)}`}
            alt={m.name}
            fill
            sizes={large ? "(min-width: 1024px) 34vw, 100vw" : "(min-width: 1024px) 18vw, 45vw"}
            className="object-cover object-top"
          />
        </div>
      </div>
      <figcaption className="mt-4">
        <span className={cn("block font-display text-ink leading-tight", large ? "text-[1.75rem]" : "text-[1.25rem]")}>{m.name}</span>
        <span className="block t-label text-ink-muted mt-2">{role}</span>
      </figcaption>
    </figure>
  );
}

export default async function Team({ labels }: { labels: { leadership: string; officers: string } }) {
  const t = await getTranslations("team");
  return (
    <div className="space-y-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
        <div className="lg:col-span-5">
          <Portrait m={ceo} role={t(`roles.${ceo.roleKey}`)} large />
        </div>
        <div className="lg:col-span-7">
          <p className="t-label text-ink-muted mb-6 pb-4 border-b border-line-strong">{labels.leadership}</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {leadership.map((m) => (
              <li key={m.name}><Portrait m={m} role={t(`roles.${m.roleKey}`)} /></li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <p className="t-label text-ink-muted mb-6 pb-4 border-b border-line-strong">{labels.officers}</p>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {officers.map((m) => (
            <li key={m.name}><Portrait m={m} role={t(`roles.${m.roleKey}`)} /></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
