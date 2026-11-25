import Image from "next/image";
import { Jost } from "next/font/google";
import { SampleAction } from "./SampleAction";
import { SampleForm } from "./SampleForm";
import { ugx } from "../demos";
import s from "./studio.module.css";

/* Sample: Amani Studio (made up). A service business: hair, nails, make-up.
   Editorial and calm, booked in a message. */

const jost = Jost({ subsets: ["latin"], style: ["normal", "italic"], variable: "--studio-sans", display: "swap" });

const NAME = "Amani Studio";
const book = (what: string, price?: number) =>
  `Hello ${NAME}, I would like to book ${what}${price ? ` (${ugx(price)})` : ""}. Which days do you have free this week?`;

const MENU: { group: string; items: { name: string; note: string; price: number }[] }[] = [
  { group: "Hair", items: [
    { name: "Knotless braids", note: "Medium, waist length · about 5 hours", price: 90000 },
    { name: "Silk press", note: "Wash, treatment and press", price: 45000 },
    { name: "Wash & blow-dry", note: "45 minutes", price: 25000 },
  ] },
  { group: "Nails", items: [
    { name: "Gel manicure", note: "Shape, cuticle care, gel colour", price: 30000 },
    { name: "Spa pedicure", note: "Soak, scrub, massage, polish", price: 35000 },
  ] },
  { group: "Make-up", items: [
    { name: "Event make-up", note: "Lashes included", price: 80000 },
  ] },
];

export function Studio() {
  return (
    <div className={`${s.root} ${jost.variable}`}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="#top" className={s.logo}>Amani<small>Studio · Ntinda</small></a>
          <nav className={s.links} aria-label="Amani Studio">
            <a href="#services">Services</a><a href="#studio">The studio</a><a href="#bridal">Bridal</a><a href="#visit">Visit</a>
          </nav>
          <SampleAction className={s.pill} message={book("an appointment")}>Book now</SampleAction>
        </div>
      </header>

      <main id="top">
        <section className={s.hero}>
          <div className={`${s.wrap} ${s.heroGrid}`}>
            <div>
              <p className={s.eyebrow}>Hair · Nails · Make-up · Ntinda, Kampala</p>
              <h1 className={`${s.serif} ${s.h1}`}>Unhurried beauty, <em>booked in a message.</em></h1>
              <p className={s.lead}>Braids that last, nails that stay neat for weeks, and make-up for the days you will remember. One chair at a time, in a calm room off the main road.</p>
              <div className={s.ctas}>
                <SampleAction className={s.pill} message={book("an appointment")}>Book on WhatsApp</SampleAction>
                <a href="#services" className={s.ghost}>See prices</a>
              </div>
            </div>
            <div className={s.heroPhoto}>
              <Image src="/websites/samples/studio-braids.webp" alt="Long knotless braids being finished by hand" fill priority sizes="(min-width: 1000px) 40vw, 100vw" style={{ objectFit: "cover", objectPosition: "50% 30%" }} />
              <p className={s.tag}>Knotless braids from <b>{ugx(90000)}</b></p>
            </div>
          </div>
        </section>

        <section id="services" className={s.services} aria-labelledby="studio-services">
          <div className={`${s.wrap} ${s.svcGrid}`}>
            <div className={s.sticky}>
              <p className={s.eyebrow}>Services &amp; prices</p>
              <h2 id="studio-services" className={`${s.serif} ${s.h2}`} style={{ marginTop: 20 }}>Every price, before you sit down.</h2>
              <div className={s.sidePhoto}>
                <Image src="/websites/samples/studio-manicure.webp" alt="A manicure in progress" fill sizes="(min-width: 1000px) 30vw, 100vw" style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div>
              {MENU.map((g) => (
                <div key={g.group} className={s.group}>
                  <h3 className={s.groupTitle}>{g.group}</h3>
                  <ul>
                    {g.items.map((i) => (
                      <li key={i.name} className={s.item}>
                        <span className={s.itemName}>{i.name}</span>
                        <span className={s.price}>{ugx(i.price)}</span>
                        <span className={s.itemNote}>{i.note}<SampleAction className={s.bookLink} message={book(i.name, i.price)}>Book</SampleAction></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="studio" className={s.band} aria-labelledby="studio-room">
          <div className={s.bandImg}>
            <Image src="/websites/samples/studio-nails.webp" alt="Nail care at the studio table" fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
          <div className={s.panel}>
            <h2 id="studio-room" className={`${s.serif} ${s.h2}`}>A calm room, and your own time.</h2>
            <ul>
              <li>Booked clients first <span>Walk-ins welcome after</span></li>
              <li>Fresh tools for every client <span>Sterilised daily</span></li>
              <li>Free Wi-Fi and tea <span>Stay as long as it takes</span></li>
            </ul>
          </div>
        </section>

        <section id="bridal" className={s.bridal}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Bridal &amp; events</p>
            <p className={`${s.serif} ${s.quoteLine}`} style={{ marginTop: 24 }}>We come to you on the day, with a trial the week before.</p>
            <p className={s.bridalMeta}>Bride&apos;s make-up and hair, with trial: <b>{ugx(250000)}</b> · Each bridesmaid: <b>{ugx(60000)}</b></p>
            <div className={s.ctas} style={{ justifyContent: "center" }}>
              <SampleAction className={s.pill} message={book("bridal make-up and hair, with a trial")}>Ask about your date</SampleAction>
            </div>
          </div>
        </section>

        <section id="visit" className={s.visit} aria-labelledby="studio-visit">
          <div className={`${s.wrap} ${s.visitGrid}`}>
            <div>
              <h2 id="studio-visit" className={`${s.serif} ${s.h2}`}>Visit us</h2>
              <dl className={s.hours}>
                <div><dt>Monday – Saturday</dt><dd>8:00am – 8:00pm</dd></div>
                <div><dt>Sunday</dt><dd>10:00am – 6:00pm</dd></div>
              </dl>
              <p className={s.address}>First floor, opposite the shopping centre, Ntinda. Parking at the back.</p>
              <div className={s.ctas}>
                <SampleAction className={s.ghost} message={`Hello ${NAME}, please send me your location pin.`}>Get directions</SampleAction>
              </div>
            </div>
            <div className={s.formCard}>
              <h3 className={s.serif}>Request a time</h3>
              <SampleForm
                business={NAME}
                submit="Request my booking"
                fields={[
                  { name: "name", label: "Your name", half: true },
                  { name: "phone", label: "WhatsApp number", type: "tel", half: true },
                  { name: "service", label: "Service", type: "select", options: MENU.flatMap((g) => g.items.map((i) => i.name)), half: true },
                  { name: "date", label: "Preferred day", type: "date", half: true },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p className={s.footWord} aria-hidden="true">Amani</p>
          <div className={s.footRow}>
            <span>Amani Studio, Ntinda · a sample business</span>
            <span>Website by Vitorra Digital</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
