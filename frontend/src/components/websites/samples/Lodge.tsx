import Image from "next/image";
import { Cormorant, Space_Grotesk } from "next/font/google";
import { SampleAction } from "./SampleAction";
import { SampleForm } from "./SampleForm";
import { ugx } from "../demos";
import s from "./lodge.module.css";

/* Sample: Ridgeline Lodge (made up), on Lake Bunyonyi. Hospitality: the site
   sells a feeling first, then rooms, then dates. The lake photographs are
   real (Wikimedia Commons, CC BY-SA 4.0, credited in the footer); the rooms
   are stock and never captioned as a real place. */

const serif = Cormorant({ subsets: ["latin"], variable: "--lodge-serif", display: "swap" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--lodge-sans", display: "swap" });

const NAME = "Ridgeline Lodge";
const enquire = (what: string) => `Hello ${NAME}, I would like to ask about ${what}. Dates: ___ to ___, for ___ guests.`;

const ROOMS = [
  { name: "Lake View Cottage", img: "/websites/samples/lodge-room.webp", alt: "A wood-panelled cottage bedroom with a view to the garden", body: "Our largest room: a king bed, a fireplace for cold evenings and a private deck over the water.", sleeps: "Sleeps 2", usd: 160 },
  { name: "Island Suite", img: "/websites/samples/lodge-canopy.webp", alt: "A bright suite with twin canopy beds", body: "Two beds under nets, a reading corner and a long window facing the islands at sunrise.", sleeps: "Sleeps 2 – 3", usd: 130 },
  { name: "Garden Tent", img: "/websites/samples/lodge-tent.webp", alt: "A furnished safari tent with two beds", body: "A furnished tent among the eucalyptus, with its own bathroom and the sound of the lake at night.", sleeps: "Sleeps 2", usd: 95 },
];

const EXPERIENCES = [
  { name: "Dugout canoe to the islands", price: "USD 25 per person", body: "Two hours on the water with a local guide, stopping at two of the islands." },
  { name: "Morning birding walk", price: "USD 15 per person", body: "Leave at 6:30am. Binoculars and tea included." },
  { name: "Hike to the ridge viewpoint", price: "Free for guests", body: "About 90 minutes up and back, with the whole lake below you." },
  { name: "Kabale market visit", price: "USD 20 per person", body: "Fridays and Mondays. Transport and a guide who knows the traders." },
];

export function Lodge() {
  return (
    <div className={`${s.root} ${serif.variable} ${sans.variable}`}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="#top" className={s.logo}>Ridgeline<span>Lodge · Lake Bunyonyi</span></a>
          <nav className={s.links} aria-label="Ridgeline Lodge">
            <a href="#rooms">Rooms</a><a href="#experiences">Experiences</a><a href="#stay">Getting here</a>
          </nav>
          <a href="#stay" className={s.clayBtn}>Book a stay</a>
        </div>
      </header>

      <main id="top">
        <section className={s.hero}>
          <div className={s.heroImg}>
            <Image src="/websites/samples/lodge-islands.webp" alt="Lake Bunyonyi and its islands seen from a hillside" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "50% 60%" }} />
          </div>
          <div className={s.heroPanel}>
            <p className={s.label}>Lake Bunyonyi · Kabale, Uganda</p>
            <h1 className={s.serif}>Wake up above the islands.</h1>
            <p>Twelve rooms on a quiet ridge, a canoe at the jetty and nothing to do until breakfast.</p>
          </div>
        </section>

        <div className={s.availability}>
          <div className={`${s.wrap} ${s.availGrid}`}>
            <div className={s.availCell}>Arrive<b>Choose a date</b></div>
            <div className={s.availCell}>Nights<b>2 nights</b></div>
            <div className={s.availCell}>Guests<b>2 adults</b></div>
            <div className={s.availCta}><SampleAction className={s.clayBtn} message={enquire("a room")}>Check availability</SampleAction></div>
          </div>
        </div>

        <section className={s.intro} aria-labelledby="lodge-intro">
          <div className={`${s.wrap} ${s.introGrid}`}>
            <div>
              <p className={s.label}>The lodge</p>
              <h2 id="lodge-intro" className={`${s.serif} ${s.big}`} style={{ marginTop: 20 }}>The mist lifts at seven. Breakfast is on the deck by eight.</h2>
              <p className={s.body}>Ridgeline sits on the western shore, a short climb above the water. Rooms face the lake, meals are cooked from the morning market, and the evenings are for the fire pit.</p>
            </div>
            <div className={s.introImg}>
              <Image src="/websites/samples/lodge-mist.webp" alt="Morning mist over the islands of Lake Bunyonyi" fill sizes="(min-width: 1000px) 45vw, 100vw" style={{ objectFit: "cover" }} />
            </div>
          </div>
        </section>

        <section id="rooms" className={s.rooms} aria-labelledby="lodge-rooms">
          <div className={s.wrap}>
            <div className={s.roomsHead}>
              <h2 id="lodge-rooms" className={s.serif}>Rooms</h2>
              <p>Every rate includes breakfast and dinner for two. Children under 6 stay free.</p>
            </div>
            <div className={s.roomList}>
              {ROOMS.map((r) => (
                <article key={r.name} className={s.room}>
                  <div className={s.roomImg}><Image src={r.img} alt={r.alt} fill sizes="(min-width: 1000px) 30vw, 100vw" style={{ objectFit: "cover" }} /></div>
                  <h3>{r.name}</h3>
                  <p>{r.body}</p>
                  <div className={s.roomMeta}>
                    <span>{r.sleeps} · USD <b>{r.usd}</b> / night</span>
                    <SampleAction className={s.textBtn} message={enquire(`the ${r.name} (USD ${r.usd} a night)`)}>Ask for dates</SampleAction>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiences" className={s.exp} aria-labelledby="lodge-exp">
          <div className={`${s.wrap} ${s.expGrid}`}>
            <div>
              <p className={s.label}>Experiences</p>
              <h2 id="lodge-exp" className={`${s.serif} ${s.big}`} style={{ marginTop: 20 }}>Slow days on the water.</h2>
            </div>
            <ul className={s.expList}>
              {EXPERIENCES.map((e) => (
                <li key={e.name}><h3>{e.name}</h3><span>{e.price}</span><p>{e.body}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.mist} aria-label="Residents' rate">
          <div className={s.mistPanel}>
            <p className={`${s.q} ${s.serif}`}>Living in Uganda? Ask for the residents&apos; rate.</p>
            <p className={s.d}>From {ugx(280000)} a night for two, dinner and breakfast included.</p>
            <div style={{ marginTop: 24 }}><SampleAction className={s.clayBtn} message={enquire("the residents' rate")}>Ask on WhatsApp</SampleAction></div>
          </div>
        </section>

        <section id="stay" className={s.stay} aria-labelledby="lodge-stay">
          <div className={`${s.wrap} ${s.stayGrid}`}>
            <div>
              <p className={s.label}>Getting here</p>
              <h2 id="lodge-stay" className={`${s.serif} ${s.big}`} style={{ marginTop: 20 }}>Seven hours from Kampala, then a short boat ride.</h2>
              <dl className={s.route}>
                <div><dt>By road</dt><dd>Kampala to Kabale, then 9 km to the lake. We meet you at the jetty.</dd></div>
                <div><dt>Transfer</dt><dd>From Kabale town, on request</dd></div>
                <div><dt>Check-in</dt><dd>From 1pm · check-out by 11am</dd></div>
              </dl>
            </div>
            <div className={s.formCard}>
              <h3>Request your stay</h3>
              <SampleForm
                business={NAME}
                submit="Send my request"
                fields={[
                  { name: "name", label: "Full name", half: true },
                  { name: "email", label: "Email", type: "email", half: true },
                  { name: "phone", label: "Phone or WhatsApp", type: "tel", half: true },
                  { name: "room", label: "Room", type: "select", options: ROOMS.map((r) => r.name), half: true },
                  { name: "arrive", label: "Arrival", type: "date", half: true },
                  { name: "nights", label: "Nights", type: "number", half: true },
                  { name: "message", label: "Anything else?", type: "textarea", placeholder: "Dietary needs, transfers, a special occasion…" },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p className={s.footWord} aria-hidden="true">Ridgeline</p>
          <div className={s.footRow}>
            <span>Ridgeline Lodge · a sample business · Website by Vitorra Digital</span>
            <span>
              Lake photographs: <a href="https://commons.wikimedia.org/wiki/File:Lake_Bunyonyi_Islands_06.jpg" target="_blank" rel="noopener noreferrer">Shaayflix Dr Shaay</a> and{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Lake_Bunyonyi_Kabale_03.jpg" target="_blank" rel="noopener noreferrer">Klain890</a>,{" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
