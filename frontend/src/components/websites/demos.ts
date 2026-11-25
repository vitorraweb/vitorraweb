/* ─── Vitorra Digital — sample websites ───────────────────────────────────────
   Three made-up businesses that show an owner what UGX 500,000 buys: one page,
   up to six items with prices, opening hours, directions, and an order button
   that opens WhatsApp with the message already written.

   They are SAMPLES, and every place they appear says so. The names, places and
   prices are illustrative (round, plausible Kampala prices in November 2026),
   not real businesses, and no real phone number is ever attached: tapping
   Order shows the message that would be sent instead of sending it.

   Each sample carries its own look (`theme`, a class in globals.css under
   "VITORRA DIGITAL") because the point is that the client's site looks like
   the client, not like Vitorra.                                              */

export type DemoItem = { name: string; note?: string; price: number; unit?: string };

export type Demo = {
  slug: "salon" | "hardware" | "restaurant";
  theme: string;
  name: string;
  /** Short monogram for the logo tile. */
  mark: string;
  kind: string;
  area: string;
  tagline: string;
  /** What the order button says, and the verb inside the WhatsApp message. */
  orderLabel: string;
  orderVerb: string;
  itemsTitle: string;
  items: DemoItem[];
  hours: [string, string][];
  directions: string;
  extra: string;
};

export const DEMOS: Demo[] = [
  {
    slug: "salon",
    theme: "demo-salon",
    name: "Amani Beauty Studio",
    mark: "A",
    kind: "Hair, nails & make-up",
    area: "Ntinda, Kampala",
    tagline: "Braids, nails and bridal make-up, booked in one message.",
    orderLabel: "Book",
    orderVerb: "book",
    itemsTitle: "Services & prices",
    items: [
      { name: "Knotless braids", note: "Medium, waist length", price: 90000 },
      { name: "Wash & blow-dry", price: 25000 },
      { name: "Gel manicure", price: 30000 },
      { name: "Pedicure", price: 25000 },
      { name: "Bridal make-up", note: "Trial included", price: 150000 },
      { name: "Men's cut & shave", price: 15000 },
    ],
    hours: [["Mon – Sat", "8:00am – 8:00pm"], ["Sunday", "10:00am – 6:00pm"]],
    directions: "Opposite the Ntinda shopping centre, first floor. Parking at the back.",
    extra: "Walk-ins welcome. Booked clients are served first.",
  },
  {
    slug: "hardware",
    theme: "demo-hardware",
    name: "Jenga Hardware & Supplies",
    mark: "J",
    kind: "Building materials",
    area: "Nansana, Wakiso",
    tagline: "Cement to iron sheets, delivered to your site.",
    orderLabel: "Order",
    orderVerb: "order",
    itemsTitle: "Today's prices",
    items: [
      { name: "Cement", note: "50 kg bag", price: 33000, unit: "per bag" },
      { name: "Iron sheets", note: "Gauge 28, 3 m", price: 38000, unit: "per sheet" },
      { name: "Wheelbarrow", note: "Heavy duty", price: 150000 },
      { name: "Wall paint", note: "20 litres, white", price: 220000 },
      { name: "Roofing nails", price: 8000, unit: "per kg" },
      { name: "Y12 steel bar", note: "12 m", price: 42000, unit: "per bar" },
    ],
    hours: [["Mon – Sat", "7:00am – 7:00pm"], ["Sunday", "Closed"]],
    directions: "On Hoima Road, 200 m past the Nansana taxi stage, on the left.",
    extra: "Delivery to Kampala and Wakiso. Ask for the fee to your site.",
  },
  {
    slug: "restaurant",
    theme: "demo-restaurant",
    name: "Mama Rose Kitchen",
    mark: "R",
    kind: "Local food & office lunch",
    area: "Kansanga, Kampala",
    tagline: "Home-cooked Ugandan food. Order by 11am for office lunch.",
    orderLabel: "Order",
    orderVerb: "order",
    itemsTitle: "Menu",
    items: [
      { name: "Chicken luwombo", note: "With matooke and rice", price: 25000 },
      { name: "Beef stew & matooke", price: 15000 },
      { name: "Whole tilapia", note: "Fried or stewed", price: 30000 },
      { name: "Rolex", note: "Two eggs, cabbage, tomato", price: 4000 },
      { name: "Office lunch box", note: "Order by 11am", price: 12000 },
      { name: "Fresh passion juice", price: 5000 },
    ],
    hours: [["Mon – Fri", "7:00am – 9:00pm"], ["Sat – Sun", "9:00am – 10:00pm"]],
    directions: "Ggaba Road, next to the Kansanga market entrance.",
    extra: "Delivery by boda within 5 km. Fee on WhatsApp.",
  },
];

export const findDemo = (slug: string) => DEMOS.find((d) => d.slug === slug);

export const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
