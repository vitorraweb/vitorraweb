import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Shield,
  Zap,
  Heart,
  Users,
  PawPrint,
  Scissors,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────
   All content faithfully sourced from sealwoundcare.com
   NO external links except the single one at the very bottom
   ────────────────────────────────────────────────────────────────── */

const FIRST_RESPONDER_AGENCIES = [
  'City of St. Clair Police',
  'Golden Police, Colorado',
  'Mobile County E.M.S.',
  'Ohio Department of Law Enforcement',
  'Azle Fire Department',
  'Baltimore City Fire Department',
  'Stearns County, Minnesota',
  'REMS (Regional Emergency Medical Services)',
];

const PRODUCTS = [
  {
    id: 'otc',
    name: 'SEAL\u2122 OTC Hemostatic Spray',
    size: '1.5 oz',
    subtitle: 'Consumer First Aid',
    image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Seal_OTC_6d7f6137-8e71-4c6b-97a0-e98d58bc5a50.jpg?v=1766107863&width=600&height=600&crop=center',
    desc: 'FDA-cleared for minor cuts, scrapes, and everyday bleeding.',
    longDesc: 'A breakthrough chitosan-based aerosol that uses a patented fine mist to shield wounds and promote natural clotting. Designed for everyday life \u2013 compact enough for hiking kits, travel bags, and home medicine cabinets.',
    specs: [
      { label: 'Size', value: '1.5oz aerosol can' },
      { label: 'Formula', value: 'Sterile chitosan dry powder' },
      { label: 'Use', value: 'Single-use' },
      { label: 'Shelf Life', value: '36 months' },
      { label: 'Storage', value: 'Room temperature, no refrigeration required' },
      { label: 'Tested to', value: 'MIL-STD-810H (heat, cold, altitude)' },
      { label: 'Removal', value: 'Rinse with saline or water, wipe with sterile gauze' },
      { label: 'Made in', value: 'Baltimore, Maryland, USA \ud83c\uddfa\ud83c\uddf8' },
    ],
    clearance: 'FDA Cleared',
    faqs: [
      { q: 'Is SEAL OTC safe for kids?', a: 'Yes. SEAL is FDA-cleared for over-the-counter use and is safe for children when used by an adult. It\u2019s a great addition to family first aid kits, schools, and camps.' },
      { q: 'How fast does it work?', a: 'SEAL typically begins forming a barrier within seconds of contact with blood. Most bleeding is controlled in under five seconds when used correctly with light pressure.' },
      { q: 'Does SEAL replace a bandage or gauze?', a: 'SEAL controls the bleeding but does not replace a bandage. After application and clotting, you can cover the area with a clean dressing or seek medical attention if needed.' },
      { q: 'What does it feel like when applied?', a: 'SEAL sprays as a fine powder and reacts with blood to form a soft, gel-like barrier. It does not burn or sting and does not stick to skin or clothing.' },
      { q: 'How do I clean it off after use?', a: 'To remove SEAL, rinse the area with saline or clean water and gently wipe with sterile gauze. It\u2019s designed for easy removal in follow-up care.' },
      { q: 'Does it expire or need refrigeration?', a: 'SEAL has a shelf life of 36 months and does not require refrigeration. Store at room temperature in your home, car, or travel kit.' },
      { q: 'Can I travel with it?', a: 'Yes. SEAL is TSA-compliant for checked bags and small enough for most carry-on emergency kits. Always check the latest TSA guidelines before flying.' },
      { q: 'Where is SEAL made?', a: 'SEAL is proudly manufactured in Baltimore, Maryland, USA.' },
    ],
  },
  {
    id: 'pro',
    name: 'SEAL\u2122 PRO Hemostatic Spray',
    size: '2.5 oz',
    subtitle: 'Professional Response',
    image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Seal_Pro_68a2e37a-db5f-4e15-9a8a-fe619ad33c1c.jpg?v=1766109372&width=600&height=600&crop=center',
    desc: 'Rx-only spray designed for trained professionals treating severe bleeding in the field.',
    longDesc: 'A patented, powerful solution for first responders and tactical teams. Provides fast, reliable hemostasis when seconds count. Higher velocity dispersion for rapid control of moderate to severe external hemorrhage.',
    specs: [
      { label: 'Size', value: '2.5oz aerosol can' },
      { label: 'Formula', value: 'Sterile chitosan dry powder' },
      { label: 'Use', value: 'Single-use' },
      { label: 'Pressure', value: '~80 PSI professional grade' },
      { label: 'Tested to', value: 'MIL-STD-810H (heat, cold, altitude)' },
      { label: 'Removal', value: 'Rinse with saline or water, wipe with sterile gauze' },
      { label: 'Clearance', value: 'Rx Only' },
      { label: 'Made in', value: 'Baltimore, Maryland, USA \ud83c\uddfa\ud83c\uddf8' },
    ],
    clearance: 'Rx Only',
    intendedUsers: [
      'Emergency Medical Technicians (EMTs)',
      'Paramedics',
      'Combat Medics',
      'Police Departments',
      'Fire Departments',
      'Hospital Emergency Departments',
      'Any medical professional trained in emergency bleeding control',
    ],
    faqs: [
      { q: 'Who can purchase SEAL PRO?', a: 'SEAL PRO is an Rx-only medical device. It\u2019s intended for use by certified medical professionals trained in bleeding control techniques. Purchasers must confirm their credentials at checkout.' },
      { q: 'How is SEAL PRO different from the OTC version?', a: 'SEAL PRO is higher volume (2.5oz / 7.1oz) and indicated for moderate to severe bleeding, including arterial and junctional wounds. OTC is for minor bleeding only. SEAL PRO is Rx-only due to its advanced use cases and application volume.' },
      { q: 'Can SEAL PRO be used for arterial bleeds?', a: 'Yes. When properly applied with pressure, SEAL PRO is effective in treating accessible arterial bleeding, including in junctional areas.' },
      { q: 'Does SEAL PRO replace a tourniquet?', a: 'No, but it can reduce reliance on a tourniquet, especially in areas where tourniquets can\u2019t be applied (e.g., neck, groin, or underarm).' },
      { q: 'Is SEAL PRO safe for coagulopathic patients?', a: 'Yes. SEAL has been tested in animal models with normal and impaired clotting function. Always monitor patients post-application.' },
      { q: 'Has SEAL PRO been tested in real-world scenarios?', a: 'Yes. SEAL PRO has been deployed in EMS, military, and tactical operations. It\u2019s also approved for use by agencies like Maryland EMS.' },
      { q: 'Can I use SEAL PRO in extreme environments?', a: 'Yes. SEAL PRO meets MIL-STD-810H testing standards for temperature, altitude, and humidity. It performs in rain, snow, wind, and low-light conditions.' },
    ],
  },
  {
    id: 'hemoseal',
    name: 'HemoSEAL\u2122 Pet Wound Spray',
    size: '2.8 oz',
    subtitle: 'Veterinary Care',
    image: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/SEAL_HemoSEAL.jpg?v=1766775431&width=600&height=600&crop=center',
    desc: 'Fast-acting hemostatic spray for pets and animals to help stop bleeding quickly.',
    longDesc: 'Your go-to solution for rapid bleeding control in dogs, cats, livestock, and working animals. Formulated with a powerful, sting-free hemostatic agent, HemoSEAL\u2122 quickly stops bleeding from cuts, abrasions, lacerations, and nail injuries. Whether you\u2019re a pet parent, veterinarian, EMS provider, or working dog handler, this compact, field-ready spray belongs in every animal first aid kit.',
    specs: [
      { label: 'Size', value: '2.8oz aerosol can' },
      { label: 'Formula', value: 'Sting-free hemostatic agent' },
      { label: 'Species', value: 'Dogs, cats, horses, goats, and more' },
      { label: 'Use', value: 'Single-use per animal' },
      { label: 'Made in', value: 'USA \ud83c\uddfa\ud83c\uddf8' },
    ],
    clearance: 'Veterinary Use',
    features: [
      { title: 'Stops Bleeding Fast', desc: 'Promotes rapid clotting at the site of injury' },
      { title: 'Sting-Free Formula', desc: 'Safe and gentle for pets of all sizes' },
      { title: 'Veterinarian Recommended', desc: 'Trusted by clinics and animal hospitals nationwide' },
      { title: 'Used by Professionals', desc: 'Police K9 units, ranchers, and search & rescue teams rely on HemoSEAL' },
      { title: 'Multi-Species Safe', desc: 'Effective for dogs, cats, horses, goats, and more' },
      { title: 'No Fur Gluing', desc: 'Forms a protective barrier without sticking to fur or pulling hair during cleanup' },
    ],
    faqs: [
      { q: 'What kind of wounds can I use HemoSEAL on?', a: 'Cuts, abrasions, lacerations, and nail injuries on pets and livestock.' },
      { q: 'What kind of animals is HemoSEAL safe to use on?', a: 'Dogs, cats, horses, goats, livestock, and other domestic animals.' },
      { q: 'Is HemoSEAL safe for cats and small pets?', a: 'Yes. The sting-free formula is gentle and safe for animals of all sizes.' },
      { q: 'Will HemoSEAL sting or irritate the wound?', a: 'No. HemoSEAL is specifically formulated to be sting-free.' },
      { q: 'How long does HemoSEAL take to work?', a: 'HemoSEAL begins promoting clotting within seconds of application.' },
      { q: 'Do I still need to see a veterinarian after using HemoSEAL?', a: 'For serious or deep wounds, always follow up with professional veterinary care.' },
    ],
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Shake the can', desc: 'Activate the formula by giving it a good shake.' },
  { step: '02', title: 'Spray directly on the wound', desc: 'Hold 6\u201310 inches away and apply a steady spray to fully cover the bleeding area.' },
  { step: '03', title: 'Let it work', desc: 'Chitosan binds to blood cells and platelets, forming a fast, stable clot.' },
  { step: '04', title: 'Seek care if needed', desc: 'For deeper or more serious wounds, follow up with professional medical attention.' },
];

const SCIENCE_SECTIONS = [
  {
    kicker: 'Formula',
    title: 'Powered by Chitosan',
    text: "SEAL\u2019s patented formula is built around chitosan, a bioactive polymer selected for how it behaves in blood. It supports platelet adhesion and interacts with fibrinogen to accelerate formation of a cohesive polymer\u2013protein matrix. With sustained pressure, that matrix consolidates into a stable physical barrier that helps control external bleeding.",
    subtitle: 'Consistent Hemostatic Action',
    subtext: "SEAL\u2019s formulation is engineered to behave predictably at the point of care. The interaction between chitosan and blood is immediate and repeatable, producing consistent barrier formation without relying solely on the body\u2019s natural clotting cascade. This enables reliable hemorrhage control even in high-flow or compromised conditions.",
  },
  {
    kicker: 'Aerosolization',
    title: 'High-Power Aerosol Coverage',
    text: 'SEAL uses a patented aerosol delivery system to disperse dry chitosan particles at high velocity. This approach allows the material to reach irregular wound surfaces and complex geometries that are difficult to treat with dressings, gauze, or loose powders. Upon contact with blood, the aerosolized particles begin forming a cohesive barrier when combined with pressure.',
    subtitle: 'Uniform Coverage, Every Time',
    subtext: 'The aerosol system is designed for predictable dispersion and uniform coverage across the wound surface. The OTC can is ~65 PSI, and the Pro can is ~80 PSI. Performance remains stable across real-world handling, transport, and storage conditions, ensuring reliable deployment in environments where access, visibility, and time are limited.',
  },
  {
    kicker: 'Performance',
    title: 'Performance Under Physiological Stress',
    text: "SEAL is designed to function when bleeding control is most challenging. In arterial bleeding models, including subjects with impaired clotting due to anticoagulation, SEAL achieved rapid and sustained hemorrhage control by forming a physical barrier independent of normal coagulation pathways.",
    subtitle: 'Validated Across Extreme Environments',
    subtext: "SEAL has completed environmental and altitude testing aligned with MIL-STD-810H protocols. The product maintained aerosol performance and hemostatic function following exposure to temperatures ranging from \u221231\u00b0C (\u221224\u00b0F) to 71\u00b0C (160\u00b0F), as well as altitude testing up to 40,000 feet, without degradation or loss of effectiveness.",
  },
  {
    kicker: 'Application',
    title: 'Seamless Workflow Integration',
    text: 'SEAL is designed to integrate directly into existing bleeding control protocols without adding complexity. The aerosol format enables rapid application in prehospital and emergency settings, while remaining fully compatible with standard trauma workflows once a patient transitions to definitive care. No mixing, assembly, or specialized equipment is required.',
    subtitle: 'Easy Clinical Removal',
    subtext: 'SEAL forms a temporary hemostatic barrier that does not permanently bond to tissue. For medical professionals, removal is straightforward and non-traumatic, requiring only saline or sterile water and gauze. The formulation is non-exothermic and does not cause secondary tissue damage when used as indicated, allowing subsequent medical or surgical treatment to proceed without complication.',
  },
];

const USE_CASES_EVERYDAY = [
  { title: 'Go Bags and Emergency Kits', desc: 'SEAL is compact, easy to use, and built for the kit you grab first when things go wrong.' },
  { title: 'Seniors on Blood Thinners', desc: 'Extra support when bleeding is harder to manage and you need control quickly at home.' },
  { title: 'Kids and Families', desc: 'Sting-free and simple, so parents and caregivers can handle the moment and move on to next steps.' },
  { title: 'Outdoor Enthusiasts', desc: 'Made for trail days, cold weather, and messy conditions when you are far from help.' },
  { title: 'Roadside Emergencies', desc: 'A clear step for the minutes after a crash, when you are waiting for responders and staying focused on safety.' },
  { title: 'Kitchen Injuries', desc: 'For knife slips, broken glass, and the cuts that happen at home when you are moving fast.' },
];

const USE_CASES_PROFESSIONAL = [
  { title: 'EMS Teams', desc: 'SEAL PRO controls bleeding fast during prehospital care. No unpacking, no delay, and no need to expose the wound further.', img: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/EMS-min.jpg?v=1758248591&width=600&height=686&crop=center' },
  { title: 'Fire Rescue Units', desc: 'Deployed on-scene during trauma calls where fast clotting is critical before transport or further stabilization.', img: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Fire_Rescue-min.jpg?v=1758248594&width=600&height=686&crop=center' },
  { title: 'Police Departments', desc: 'Used by officers in tactical med kits and active threat situations where medical backup may be delayed.', img: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Police-min.jpg?v=1758248595&width=600&height=686&crop=center' },
  { title: 'Military Medics', desc: 'Carried in IFAKs and field packs to control moderate to severe bleeding in combat and austere environments.', img: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Military-min.jpg?v=1758248597&width=600&height=686&crop=center' },
  { title: 'Wilderness Responders', desc: 'Ideal for SAR teams and outdoor medics treating injuries in rugged terrain far from definitive care.', img: 'https://cdn.shopify.com/s/files/1/0570/7487/6491/files/Military-min.jpg?v=1758248597&width=600&height=686&crop=center' },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */
export default function Seal() {
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroVideo = 'https://cdn.shopify.com/videos/c/vp/9658a6ea35be4814a83fe106e3c9b714/9658a6ea35be4814a83fe106e3c9b714.HD-1080p-4.8Mbps-59154649.mp4';

  const [useCaseTab, setUseCaseTab] = useState<'everyday' | 'professional'>('everyday');
  const [openScience, setOpenScience] = useState<number | null>(0);
  const [activeProduct, setActiveProduct] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, [location.pathname]);

  const product = PRODUCTS[activeProduct];

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text transition-colors duration-500">

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 1 — HERO                        ║
          ╚══════════════════════════════════════════╝ */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={location.pathname}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover opacity-90"
            poster="https://cdn.shopify.com/s/files/1/0570/7487/6491/files/poster.jpg?v=1759965602"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

        <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <div className="text-[11px] font-bold tracking-[0.3em] uppercase text-white/50 mb-6">
              Patented. FDA cleared. Field proven.
            </div>
            <h1 className="text-white drop-shadow-2xl mb-6">Stop Bleeding in Seconds</h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The world&apos;s first and only FDA-cleared chitosan spray. Trusted by EMS, police, military medics, and trauma teams in the field.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/30"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => document.getElementById('science')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 px-10 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 font-bold rounded-full text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                How it works
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {['FDA Cleared', 'Made in USA', 'Patented Formula'].map((badge, i) => (
                <span key={i} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-white/70 text-[10px] font-bold uppercase tracking-widest">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="w-8 h-12 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 2 — TRUSTED BY FIRST RESPONDERS ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-12 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase">Trusted by First Responders Worldwide</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {FIRST_RESPONDER_AGENCIES.map((agency, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-vitorra-card border border-vitorra-border">
                <Shield className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px] font-bold text-vitorra-muted whitespace-nowrap">{agency}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 3 — CHOOSE YOUR SEAL SPRAY      ║
          ╚══════════════════════════════════════════╝ */}
      <section id="products" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-vitorra-text leading-tight">Choose Your SEAL Spray</h2>
          </div>

          {/* Product selector tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {PRODUCTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveProduct(idx); setOpenFaq(null); }}
                className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  activeProduct === idx
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text'
                }`}
              >
                {p.name.replace('\u2122', '')}
              </button>
            ))}
          </div>

          {/* Active product detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProduct}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              {/* Product image */}
              <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 p-8 md:p-12 flex items-center justify-center border border-vitorra-border">
                <img src={product.image} alt={product.name} className="w-full max-w-md h-auto object-contain" />
              </div>

              {/* Product info */}
              <div className="space-y-8">
                <div>
                  <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{product.subtitle}</span>
                  <h3 className="text-3xl font-bold text-vitorra-text mt-2">{product.name} {product.size}</h3>
                  <span className="inline-block mt-3 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400 tracking-widest">
                    {product.clearance}
                  </span>
                </div>

                <p className="text-vitorra-muted leading-relaxed">{product.longDesc}</p>

                {/* Intended users (PRO only) */}
                {'intendedUsers' in product && product.intendedUsers && (
                  <div>
                    <h4 className="text-sm font-bold text-vitorra-text mb-3">Intended For:</h4>
                    <ul className="space-y-1.5">
                      {(product.intendedUsers as string[]).map((user, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-vitorra-muted">
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" /> {user}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* HemoSEAL features */}
                {'features' in product && product.features && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(product.features as { title: string; desc: string }[]).map((f, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-vitorra-bg border border-vitorra-border">
                        <h4 className="text-sm font-bold text-vitorra-text mb-1">{f.title}</h4>
                        <p className="text-xs text-vitorra-muted">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Specifications */}
                <div>
                  <h4 className="text-sm font-bold text-vitorra-text mb-4">Specifications</h4>
                  <div className="space-y-2">
                    {product.specs.map((spec, i) => (
                      <div key={i} className="flex justify-between items-start py-2 border-b border-vitorra-border/50 last:border-0 text-sm">
                        <span className="text-vitorra-muted">{spec.label}</span>
                        <span className="text-vitorra-text font-medium text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Product FAQs */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-vitorra-text mb-8 text-center">
              {product.name.replace('\u2122', '')} FAQs
            </h3>
            <div className="max-w-4xl mx-auto space-y-3">
              {product.faqs.map((faq, idx) => (
                <div key={`${activeProduct}-${idx}`} className="rounded-2xl bg-vitorra-card border border-vitorra-border overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="text-vitorra-text text-sm font-medium pr-4">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-vitorra-muted shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="px-6 pb-4 text-sm text-vitorra-muted leading-relaxed">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 4 — HOW IT WORKS                ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-vitorra-text leading-tight">How It Works</h2>
            <p className="text-vitorra-muted mt-4 max-w-xl mx-auto">Four simple steps. No training required for OTC use.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-vitorra-card border border-vitorra-border text-center"
              >
                <div className="text-4xl font-bold text-red-500/20 mb-4">{step.step}</div>
                <h3 className="text-lg font-bold text-vitorra-text mb-3">{step.title}</h3>
                <p className="text-sm text-vitorra-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 5 — CLINICALLY PROVEN           ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-vitorra-text leading-tight mb-8">Clinically Proven. Field Tested.</h2>
              <p className="text-vitorra-muted leading-relaxed text-lg mb-8">
                SEAL represents a new standard in bleeding control technology. Our patented chitosan aerosol is the result of years of research and field testing to ensure reliability when seconds matter most. Made in the USA and backed by FDA clearance and MIL-STD-810H certification, SEAL is engineered to perform in the most demanding conditions: rain, heat, cold, or low light.
              </p>
              <p className="text-vitorra-muted leading-relaxed mb-8">
                SEAL is faster, easier to use, and far more effective in the moments that matter.
              </p>
              <button
                onClick={() => document.getElementById('science')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                The Science Behind SEAL <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
              <div className="rounded-3xl overflow-hidden border border-vitorra-border shadow-2xl">
                <img
                  src="https://cdn.shopify.com/s/files/1/0570/7487/6491/files/science_fomula_poster_86574a75-c9a7-4481-ab51-52dd588026de.jpg?v=1769998282"
                  alt="SEAL Science - Chitosan Matrix Formation"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 p-6 rounded-2xl bg-vitorra-bg/95 border border-vitorra-border shadow-xl max-w-xs">
                <div className="text-3xl font-bold text-red-500 mb-1">~80 PSI</div>
                <p className="text-[10px] text-vitorra-muted uppercase tracking-widest">Professional Grade Aerosol Dispersion</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 6 — THE SCIENCE                 ║
          ╚══════════════════════════════════════════╝ */}
      <section id="science" className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">The Science</span>
            <h2 className="text-vitorra-text leading-tight">How SEAL Works</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {SCIENCE_SECTIONS.map((section, idx) => (
              <div key={idx} className="rounded-2xl bg-vitorra-card border border-vitorra-border overflow-hidden">
                <button
                  onClick={() => setOpenScience(openScience === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-8 py-6 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                      {section.kicker}
                    </span>
                    <span className="text-vitorra-text font-bold">{section.title}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-vitorra-muted shrink-0 transition-transform duration-300 ${openScience === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openScience === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-8 pb-8 space-y-6">
                        <p className="text-sm text-vitorra-muted leading-relaxed">{section.text}</p>
                        <div>
                          <h4 className="text-vitorra-text font-bold mb-3">{section.subtitle}</h4>
                          <p className="text-sm text-vitorra-muted leading-relaxed">{section.subtext}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 7 — TRUSTED WHERE IT MATTERS    ║
          ╚══════════════════════════════════════════╝ */}
      <section id="use-cases" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Use Cases</span>
            <h2 className="text-vitorra-text leading-tight mb-4">Trusted Where It Matters Most</h2>
            <p className="text-vitorra-muted max-w-2xl">
              From everyday accidents to field emergencies, SEAL stops bleeding fast. Trusted by families and first responders alike.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-10">
            <button
              onClick={() => setUseCaseTab('everyday')}
              className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                useCaseTab === 'everyday'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text'
              }`}
            >
              For Everyday Use
            </button>
            <button
              onClick={() => setUseCaseTab('professional')}
              className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                useCaseTab === 'professional'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-vitorra-card border border-vitorra-border text-vitorra-muted hover:text-vitorra-text'
              }`}
            >
              For Professionals
            </button>
          </div>

          <AnimatePresence mode="wait">
            {useCaseTab === 'everyday' ? (
              <motion.div key="everyday" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {USE_CASES_EVERYDAY.map((uc, idx) => (
                  <div key={idx} className="p-8 rounded-3xl bg-vitorra-card border border-vitorra-border hover:border-red-500/20 transition-all duration-500">
                    <h3 className="text-lg font-bold text-vitorra-text mb-3">{uc.title}</h3>
                    <p className="text-sm text-vitorra-muted leading-relaxed">{uc.desc}</p>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="professional" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {USE_CASES_PROFESSIONAL.map((uc, idx) => (
                  <div key={idx} className="group rounded-3xl overflow-hidden bg-vitorra-card border border-vitorra-border hover:shadow-2xl transition-all duration-500">
                    <div className="h-48 overflow-hidden">
                      <img src={uc.img} alt={uc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-vitorra-text mb-3">{uc.title}</h3>
                      <p className="text-sm text-vitorra-muted leading-relaxed">{uc.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 8 — KEY SPECS STRIP             ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-16 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: 'FDA', label: 'Cleared' },
              { stat: 'MIL-STD', label: '810H Certified' },
              { stat: 'USA', label: 'Made in America' },
              { stat: '36 mo', label: 'Shelf Life' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold text-red-500 mb-2">{item.stat}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-vitorra-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 9 — SINGLE PATIENT USE NOTICE   ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-16 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-vitorra-card border border-vitorra-border">
            <h3 className="text-lg font-bold text-vitorra-text mb-4">Why is SEAL single patient use?</h3>
            <p className="text-sm text-vitorra-muted leading-relaxed mb-4">
              SEAL is designed as a single patient use, sterile device. Once the can is activated, the sterile seal is broken and sterility inside the container can no longer be guaranteed. The can may become contaminated during use, so it should only be used on one person.
            </p>
            <p className="text-sm text-vitorra-muted leading-relaxed">
              SEAL may be used on multiple wounds on the same patient, as needed for coverage. For safety and performance reasons, do not use the same can on another patient.
            </p>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 10 — CTA + OFFICIAL LINK        ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-32 bg-vitorra-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="p-16 rounded-[3rem] bg-vitorra-card border border-vitorra-border relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full" />
              <h2 className="mb-6 text-vitorra-text relative z-10">Ready When Seconds Matter</h2>
              <p className="text-vitorra-muted max-w-xl mx-auto mb-10 relative z-10">
                Contact our team for wholesale inquiries, professional product demonstrations, or technical documentation.
              </p>
              <Link
                to="/contact"
                className="relative z-10 inline-flex items-center gap-3 px-12 py-5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all duration-300 uppercase tracking-widest text-sm shadow-2xl shadow-red-600/20"
              >
                Contact Us <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
