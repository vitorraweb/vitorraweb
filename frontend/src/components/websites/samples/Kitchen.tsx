import Image from "next/image";
import { Bricolage_Grotesque } from "next/font/google";
import { SampleAction } from "./SampleAction";
import { ugx } from "../demos";
import s from "./kitchen.module.css";

/* Sample: Mama Rose Kitchen (made up). Food business: dine in, take away,
   office lunch. Loud, warm and appetising. */

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--kitchen-sans", display: "swap" });

const NAME = "Mama Rose Kitchen";
const order = (what: string, price?: number) =>
  `Hello ${NAME}, I would like to order: ${what}${price ? `, ${ugx(price)}` : ""}. Delivery to: `;

const BOARD: { title: string; rows: { name: string; note: string; price: number }[] }[] = [
  { title: "Plates", rows: [
    { name: "Chicken luwombo", note: "Steamed in banana leaf, with matooke", price: 25000 },
    { name: "Beef stew & matooke", note: "With greens and groundnut sauce", price: 15000 },
    { name: "Whole tilapia", note: "Fried or stewed, with chips or posho", price: 30000 },
  ] },
  { title: "Quick bites", rows: [
    { name: "Rolex", note: "Two eggs, cabbage, tomato", price: 4000 },
    { name: "Spiced rice & beef", note: "Pilau, kachumbari", price: 14000 },
    { name: "Chapati & beans", note: "Two chapatis", price: 6000 },
  ] },
  { title: "To drink", rows: [
    { name: "Fresh passion juice", note: "Made this morning", price: 5000 },
    { name: "African tea", note: "Spiced, with milk", price: 3000 },
    { name: "Mango smoothie", note: "Seasonal", price: 7000 },
  ] },
];

export function Kitchen() {
  return (
    <div className={`${s.root} ${sans.variable}`}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="#top" className={s.logo}><b>MAMA ROSE</b><span>Kitchen · Kansanga</span></a>
          <nav className={s.links} aria-label="Mama Rose Kitchen">
            <a href="#menu">Menu</a><a href="#lunch">Office lunch</a><a href="#story">Our kitchen</a><a href="#visit">Visit</a>
          </nav>
          <SampleAction className={s.order} message={order("")}>Order now</SampleAction>
        </div>
      </header>

      <main id="top">
        <section className={s.hero}>
          <div className={s.heroImg}>
            <Image src="/websites/samples/kitchen-grill.webp" alt="Food cooking on the grill in an open kitchen" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
          <div className={s.heroPanel}>
            <h1 className={s.display}>Home cooking, hot from the pan.</h1>
            <p>Ugandan food the way it is made at home: slow stews, luwombo in banana leaf and fresh juice every morning. Eat here, take away, or we bring it to you.</p>
            <div className={s.heroCtas}>
              <SampleAction className={s.dark} message={order("")}>Order on WhatsApp</SampleAction>
              <a href="#menu" className={s.line}>See the menu</a>
            </div>
          </div>
        </section>

        <section id="menu" className={s.menu} aria-labelledby="kitchen-menu">
          <div className={s.wrap}>
            <div className={s.menuHead}>
              <h2 id="kitchen-menu" className={s.display}>The menu</h2>
              <p>Prices include a plate of greens. Tap any dish to order it for pick-up or delivery within 5 km.</p>
            </div>
            <div className={s.dishes}>
              <div className={s.dish}>
                <Image src="/websites/samples/kitchen-rice.webp" alt="A plate of spiced rice with beef" fill sizes="(min-width: 760px) 50vw, 100vw" style={{ objectFit: "cover" }} />
                <p className={s.dishLabel}>Spiced rice &amp; beef <span>{ugx(14000)}</span></p>
              </div>
              <div className={s.dish}>
                <Image src="/websites/samples/kitchen-plate.webp" alt="Meatballs in tomato sauce with rice" fill sizes="(min-width: 760px) 50vw, 100vw" style={{ objectFit: "cover" }} />
                <p className={s.dishLabel}>Beef stew &amp; rice <span>{ugx(15000)}</span></p>
              </div>
            </div>
            <div className={s.board}>
              {BOARD.map((c) => (
                <div key={c.title} className={s.col}>
                  <h3>{c.title}</h3>
                  <ul>
                    {c.rows.map((r) => (
                      <li key={r.name} className={s.row}>
                        <b>{r.name}</b><em>{ugx(r.price)}</em>
                        <small>{r.note}</small>
                        <SampleAction className={s.add} message={order(r.name, r.price)}>Order</SampleAction>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="lunch" className={s.lunch} aria-labelledby="kitchen-lunch">
          <div className={`${s.wrap} ${s.lunchGrid}`}>
            <h2 id="kitchen-lunch" className={s.display}>Lunch at your desk by one.</h2>
            <div>
              <dl className={s.lunchFacts}>
                <div><dt>Order by</dt><dd>11:00am</dd></div>
                <div><dt>Lunch box</dt><dd>{ugx(12000)}</dd></div>
                <div><dt>5 boxes or more</dt><dd>Free delivery within 3 km</dd></div>
                <div><dt>Pay</dt><dd>Mobile Money on delivery</dd></div>
              </dl>
              <SampleAction className={s.cream} message={order("office lunch boxes for ___ people, for tomorrow")}>Order for the office</SampleAction>
            </div>
          </div>
        </section>

        <section id="story" className={s.story} aria-labelledby="kitchen-story">
          <div className={s.storyGrid}>
            <div className={s.storyImg}>
              <Image src="/websites/samples/kitchen-plating.webp" alt="Hands plating food at the pass" fill sizes="(min-width: 1000px) 50vw, 100vw" style={{ objectFit: "cover" }} />
            </div>
            <div className={s.storyText}>
              <h2 id="kitchen-story" className={s.display}>Cooked the slow way.</h2>
              <p>Every stew starts before seven in the morning. Groundnut sauce is pounded here, matooke is steamed in leaves, and when a pot is finished, it is finished: come early for the luwombo.</p>
            </div>
          </div>
        </section>

        <section id="visit" className={s.visit} aria-label="Visit">
          <div className={`${s.wrap} ${s.visitGrid}`}>
            <div>
              <h3>Find us</h3>
              <p>Ggaba Road, next to the Kansanga market entrance. Parking in front.</p>
            </div>
            <div>
              <h3>Open</h3>
              <dl>
                <div><dt>Mon – Fri</dt><dd>7am – 9pm</dd></div>
                <div><dt>Sat – Sun</dt><dd>9am – 10pm</dd></div>
              </dl>
            </div>
            <div>
              <h3>Delivery</h3>
              <p>By boda within 5 km of Kansanga. The fee comes back with your order confirmation.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p className={s.footWord} aria-hidden="true">Mama Rose</p>
          <div className={s.footRow}><span>Mama Rose Kitchen, Kansanga · a sample business</span><span>Website by Vitorra Digital</span></div>
        </div>
      </footer>
    </div>
  );
}
