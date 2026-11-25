import Image from "next/image";
import { Source_Serif_4, Inter } from "next/font/google";
import { SampleAction } from "./SampleAction";
import { SampleForm } from "./SampleForm";
import { ugx } from "../demos";
import s from "./advisory.module.css";

/* Sample: Mirembe Advisory (made up). A professional firm that sells nothing
   off a shelf: bookkeeping, tax and registration for small businesses. The
   site's job is trust and a booked consultation. No accreditations are
   claimed, because the firm does not exist. */

const serif = Source_Serif_4({ subsets: ["latin"], style: ["normal", "italic"], variable: "--adv-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--adv-sans", display: "swap" });

const NAME = "Mirembe Advisory";
const ask = (what: string) => `Hello ${NAME}, I would like to book a consultation about ${what}. My business is: `;

const SERVICES = [
  { name: "Monthly bookkeeping", body: "Your receipts, sales and bank statements turned into clean books every month, with a one-page summary you can read in two minutes.", from: "From UGX 300,000 / month" },
  { name: "Tax returns", body: "VAT, PAYE and income tax worked out, filed on time and explained. You see every figure before anything is submitted.", from: "Included in monthly plans" },
  { name: "Company registration", body: "Name search, registration, tax number and the first filings, so you can open a business bank account in weeks, not months.", from: ugx(450000) },
  { name: "Payroll", body: "Payslips, NSSF and PAYE for teams of 2 to 50, paid and filed on the same day each month.", from: "From UGX 15,000 / person" },
  { name: "Loan-ready accounts", body: "Financial statements and cash-flow forecasts prepared the way banks and investors ask for them.", from: "Quoted per project" },
];

const FAQ = [
  { q: "Do I need to bring all my receipts to your office?", a: "No. Most clients photograph receipts on WhatsApp or share a folder once a week. We visit once a quarter if you prefer paper." },
  { q: "What if I am already behind with my filings?", a: "We start with a catch-up plan: what is owed, what can be fixed first and what it will cost, in writing before any work starts." },
  { q: "Is the monthly fee fixed?", a: "Yes. It is agreed for 12 months against the number of transactions you have. If your business grows a lot, we talk before anything changes." },
  { q: "Who will I deal with?", a: "One named accountant who knows your business, with a second who can step in when they are away." },
];

export function Advisory() {
  return (
    <div className={`${s.root} ${serif.variable} ${sans.variable}`}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="#top" className={s.logo}><b>Mirembe</b><span>Advisory</span></a>
          <nav className={s.links} aria-label="Mirembe Advisory">
            <a href="#services">Services</a><a href="#process">How we work</a><a href="#fees">Fees</a><a href="#contact">Contact</a>
          </nav>
          <a href="#contact" className={s.btn}>Book a consultation</a>
        </div>
      </header>

      <main id="top">
        <section className={s.hero}>
          <div className={s.heroText}>
            <p className={s.label}>Accounting &amp; tax for growing businesses · Kampala</p>
            <h1 className={`${s.serif} ${s.h1}`}>Clean books. Filed on time. <i>Fewer surprises.</i></h1>
            <p className={s.lead}>We keep the numbers of small and growing businesses in order, so the owners can spend their week on customers instead of paperwork.</p>
            <div className={s.ctas}>
              <a href="#contact" className={s.btn}>Book a free first consultation</a>
              <a href="#fees" className={s.btnLine}>See our fees</a>
            </div>
            <p className={s.heroFacts}><span>Bookkeeping</span><span>VAT &amp; PAYE</span><span>Company registration</span><span>Payroll</span></p>
          </div>
          <div className={s.heroImg}>
            <Image src="/websites/samples/advisory-desk.webp" alt="An accountant reviewing figures at a desk by the window" fill priority sizes="(min-width: 1000px) 50vw, 100vw" style={{ objectFit: "cover", objectPosition: "35% 50%" }} />
          </div>
        </section>

        <section id="services" className={s.section} aria-labelledby="adv-services">
          <div className={s.wrap}>
            <div className={s.head}>
              <div><p className={s.label}>What we do</p><h2 id="adv-services" className={`${s.serif} ${s.h2}`} style={{ marginTop: 16 }}>Five things, done properly.</h2></div>
              <p className={s.headP}>Most clients start with bookkeeping and tax. Everything else is added when the business needs it, never sold in a bundle.</p>
            </div>
            <ul className={s.svc}>
              {SERVICES.map((x) => (
                <li key={x.name} className={s.svcRow}><h3>{x.name}</h3><p>{x.body}</p><strong>{x.from}</strong></li>
              ))}
            </ul>
          </div>
        </section>

        <section id="process" className={`${s.section} ${s.process}`} aria-labelledby="adv-process">
          <div className={`${s.wrap} ${s.procGrid}`}>
            <div className={s.procImg}>
              <Image src="/websites/samples/advisory-meeting.webp" alt="A consultant at a meeting table with documents" fill sizes="(min-width: 1000px) 40vw, 100vw" style={{ objectFit: "cover" }} />
            </div>
            <div>
              <p className={s.label}>How we work</p>
              <h2 id="adv-process" className={`${s.serif} ${s.h2}`} style={{ marginTop: 16, marginBottom: 40 }}>From first meeting to first filing in a month.</h2>
              <ol className={s.steps}>
                <li className={s.step}><span>Week 1</span><h3>A free first consultation</h3><p>An hour, at your place or ours. We look at where your books stand and what is due.</p></li>
                <li className={s.step}><span>Week 1</span><h3>A fixed fee, in writing</h3><p>One page: what we will do, by when, and the monthly fee.</p></li>
                <li className={s.step}><span>Weeks 2–3</span><h3>Catch-up and set-up</h3><p>We bring the books up to date and set up the way you will send us receipts.</p></li>
                <li className={s.step}><span>Every month</span><h3>Books closed by the 10th</h3><p>Your summary arrives by the 10th, returns are filed before the deadline.</p></li>
              </ol>
            </div>
          </div>
        </section>

        <section id="fees" className={`${s.section} ${s.fees}`} aria-labelledby="adv-fees">
          <div className={s.wrap}>
            <p className={s.label}>Fees</p>
            <h2 id="adv-fees" className={`${s.serif} ${s.h2}`} style={{ marginTop: 16, maxWidth: "18ch" }}>One monthly fee, agreed before we start.</h2>
            <div className={s.feeTable}>
              {[
                { n: "Starter", who: "Sole traders and new companies", amt: 300000, items: ["Bookkeeping up to 100 transactions", "VAT and income tax returns", "Quarterly review call"] },
                { n: "Growing", who: "Teams of up to 15", amt: 650000, items: ["Up to 400 transactions", "All returns, including PAYE", "Payroll for up to 15 people", "Monthly review call"] },
                { n: "Established", who: "Teams of 15 and more", amt: 1200000, items: ["Unlimited transactions", "Payroll, management accounts", "Year-end statements", "A named accountant on call"] },
              ].map((f) => (
                <div key={f.n} className={s.fee}>
                  <h3>{f.n}</h3><p className={s.who}>{f.who}</p>
                  <p className={s.amount}>{ugx(f.amt)} <small>/ month</small></p>
                  <ul>{f.items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className={s.feeNote}>All fees exclude VAT. Catch-up work for past years is quoted separately after the first consultation.</p>
            <a href="#contact" className={s.btnLight}>Book a free first consultation</a>
          </div>
        </section>

        <section className={s.section} aria-labelledby="adv-faq">
          <div className={`${s.wrap} ${s.faq}`}>
            <div><p className={s.label}>Questions</p><h2 id="adv-faq" className={`${s.serif} ${s.h2}`} style={{ marginTop: 16 }}>What owners ask first.</h2></div>
            <div className={s.faqList}>
              {FAQ.map((f) => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className={`${s.section} ${s.contact}`} aria-labelledby="adv-contact">
          <div className={`${s.wrap} ${s.contactGrid}`}>
            <div>
              <p className={s.label}>Contact</p>
              <h2 id="adv-contact" className={`${s.serif} ${s.h2}`} style={{ marginTop: 16 }}>Talk to us this week.</h2>
              <dl className={s.office}>
                <div><dt>Office</dt><dd>Third floor, Kampala Road, Nakasero</dd></div>
                <div><dt>Hours</dt><dd>Monday – Friday, 8:30am – 5:30pm</dd></div>
                <div><dt>Reply</dt><dd>The same working day</dd></div>
              </dl>
              <div className={s.ctas}>
                <SampleAction className={s.btnLine} message={ask("bookkeeping and tax")}>Message us on WhatsApp</SampleAction>
              </div>
              <div className={s.officeImg}>
                <Image src="/websites/samples/advisory-office.webp" alt="An accountant at her desk in the office" fill sizes="(min-width: 1000px) 35vw, 100vw" style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div className={s.formCard}>
              <h3>Book a free first consultation</h3>
              <p>An hour with an accountant, at your office or ours. No obligation.</p>
              <SampleForm
                business={NAME}
                submit="Request a consultation"
                fields={[
                  { name: "name", label: "Your name", half: true },
                  { name: "company", label: "Business name", half: true },
                  { name: "phone", label: "Phone or WhatsApp", type: "tel", half: true },
                  { name: "email", label: "Email", type: "email", half: true },
                  { name: "need", label: "What do you need help with?", type: "select", options: SERVICES.map((x) => x.name) },
                  { name: "message", label: "Anything we should know?", type: "textarea", placeholder: "e.g. we are two years behind with VAT returns" },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footTop}><p className={s.footWord} aria-hidden="true">Mirembe</p><p>Accounting &amp; tax · Kampala</p></div>
          <div className={s.footRow}><span>Mirembe Advisory · a sample business</span><span>Website by Vitorra Digital</span></div>
        </div>
      </footer>
    </div>
  );
}
