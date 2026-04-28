import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import {
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────
   Official FET Calculator — vehicle types & EUR base prices
   Prices are converted to UGX using live exchange rates.
   ────────────────────────────────────────────────────────────────── */
const VEHICLE_OPTIONS_EUR = {
  km: [
    { value: 'PKW', label: 'Passenger car up to 2.0L displacement', eurPrice: 250 },
    { value: 'SPRINTER_7_5T', label: 'Vans, trucks & SUVs up to 7.5t', eurPrice: 450 },
    { value: 'LKW_18T', label: 'Truck up to 18t', eurPrice: 750 },
    { value: 'LKW_40T', label: 'Truck up to 40t', eurPrice: 1450 },
  ],
  h: [
    { value: 'BM_SMALL', label: 'Small construction machinery 1-3 l/h', eurPrice: 250 },
    { value: 'BM_MEDIUM', label: 'Medium construction machinery 4-8 l/h', eurPrice: 750 },
    { value: 'BM_LARGE', label: 'Large construction machinery 18-35 l/h', eurPrice: 1450 },
  ],
};

/* ──────────────────────────────────────────────────────────────────
   Section data — content faithfully sourced from fuelecotech.com/en
   ────────────────────────────────────────────────────────────────── */
const APPLICATIONS = [
  {
    title: 'Cars',
    tags: ['Cars', 'Frequent drivers'],
    tagRight: 'Eco',
    img: '/images/toyota_suv_africa.png',
    desc: 'For frequent drivers who want to reduce operating costs while lowering their CO\u2082 footprint.',
  },
  {
    title: 'Trucks & Vans',
    tags: ['Trucks & Vans', 'Fleet'],
    tagRight: 'ROI focus',
    img: 'https://fuelecotech.com/assets/img/usecases/lkw.jpg',
    desc: 'More profitability in fleet operations: lower consumption, lower emissions, reduced maintenance costs.',
  },
  {
    title: 'Agriculture',
    tags: ['Agriculture', 'Diesel'],
    tagRight: 'Efficiency',
    img: 'https://fuelecotech.com/assets/img/usecases/agri.jpg',
    desc: 'Reduces diesel consumption in tractors & harvesting machines, protects the engine and sustainably improves efficiency.',
  },
  {
    title: 'Construction Machinery',
    tags: ['Construction Machinery', 'Job Site'],
    tagRight: 'Costs',
    img: 'https://fuelecotech.com/assets/img/usecases/construction.jpg',
    desc: 'Lowers consumption and saves operating costs long-term \u2013 ideal under heavy load and long operating hours.',
  },
  {
    title: 'Public Transport',
    tags: ['Public Transport', 'Municipalities'],
    tagRight: 'CO\u2082',
    img: '/images/uganda_transport.png',
    desc: 'Helps cities reduce operating costs and CO\u2082 emissions \u2013 especially with predictable, recurring driving profiles.',
  },
  {
    title: 'Marine',
    tags: ['Marine', 'Commercial/Private'],
    tagRight: 'Emissions',
    img: 'https://fuelecotech.com/assets/img/usecases/marine.jpg',
    desc: 'Optimizes fuel consumption and improves profitability \u2013 in commercial and private use.',
  },
];

const ADVANTAGES = [
  {
    title: 'Easy to retrofit',
    desc: 'Integration into the fuel line \u2013 designed for efficient implementation across vehicle classes.',
  },
  {
    title: 'Measurable impact',
    desc: 'Especially with high mileage/operating hours, percentage values directly affect budget and ROI.',
  },
  {
    title: 'Reduce emissions',
    desc: 'Positioned around CO\u2082, soot and deposits \u2013 for clean and traceable environmental argumentation.',
  },
  {
    title: 'Fleet logic',
    desc: 'Standardized installation variants & data collection enable scalable rollouts.',
  },
  {
    title: 'Documented & verifiable',
    desc: 'Structured reports, certificates and installation instructions \u2013 for internal approvals, fleet management and audit-ready decision-making foundations.',
  },
  {
    title: 'Ready for real-world operation',
    desc: 'Clear installation processes, defined variants and repeatable rollouts \u2013 so implementation works in daily operations, not just on paper.',
  },
];

const TESTIMONIALS = [
  {
    vehicle: 'Toyota Land Cruiser V8 Diesel',
    quote: '\u201cImmediately after installation, smoother engine operation. During the observation period, average fuel consumption decreased by 1.3 l/100 km.\u201d',
    name: 'Patrick S.',
    role: 'Business customer',
    img: '/images/toyota_suv_africa.png',
  },
  {
    vehicle: 'Mercedes Actros (Fleet)',
    quote: '\u201cMeasurable fuel reduction in the fleet. Installation reduced operating costs and supports a more environmentally friendly driving style.\u201d',
    name: 'KUNA d.o.o Tuzla',
    role: 'Business customer',
    img: 'https://fuelecotech.com/assets/img/customers/actros.jpg',
  },
  {
    vehicle: 'Unimog \u2013 Winter Operation',
    quote: '\u201cAnnual operation: fuel consumption reduction of 24.6% per operating hour \u2013 significant savings under partial-load conditions.\u201d',
    name: 'Municipal fleet',
    role: 'Field test',
    img: 'https://fuelecotech.com/assets/img/customers/unimog.jpg',
  },
  {
    vehicle: 'Audi SQ7 4.0 TDI',
    quote: '\u201cSmoother startup, smoother in everyday driving. Consumption dropped by over 8% \u2013 absolutely recommended.\u201d',
    name: 'Private owner',
    role: 'Customer',
    img: 'https://fuelecotech.com/assets/img/customers/sq7.jpg',
  },
  {
    vehicle: 'Fleet vehicle',
    quote: '\u201cConsumption dropped from 8.6 to 7.4 l/100 km. Smoother engine operation, better pull at low rpm, DSG shifts up noticeably earlier.\u201d',
    name: 'Fleet operator',
    role: 'Business customer',
    img: 'https://fuelecotech.com/assets/img/customers/actros.jpg',
  },
  {
    vehicle: 'Diesel fleet',
    quote: '\u201cAround 18% less diesel \u2013 up to 200 km more per tank filling. Quieter, better pull in the lower rpm range.\u201d',
    name: 'Fleet manager',
    role: 'Business customer',
    img: 'https://fuelecotech.com/assets/img/customers/unimog.jpg',
  },
  {
    vehicle: 'High-mileage vehicle',
    quote: '\u201cSavings of over 12%. Anyone who drives a lot and wants to reduce costs long-term should give the system a chance.\u201d',
    name: 'Customer',
    role: 'Private user',
    img: '/images/toyota_suv_africa.png',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is the Fuel Eco Tech System?',
    a: 'Fuel Eco Tech is an innovative system that improves the efficiency of fuel combustion in diesel and gasoline engines. It optimizes the air-fuel mixture to reduce fuel consumption and emissions.',
  },
  {
    q: 'How does Fuel Eco Tech work?',
    a: 'The system improves the distribution and turbulence of the air-fuel mixture in the combustion chamber. This allows oxygen to be used more effectively, resulting in more complete and cleaner combustion. The result is higher efficiency and less unburned fuel.',
  },
  {
    q: 'How does Fuel Eco Tech affect engine performance?',
    a: 'Due to more effective combustion, the energy in the fuel is used more efficiently, which leads to a moderate increase in performance without placing additional strain on the engine.',
  },
  {
    q: 'Why does Fuel Eco Tech extend engine life?',
    a: 'The system reduces the build-up of deposits and residues in the engine caused by incomplete combustion. Fewer deposits mean less wear and a longer service life for engine components.',
  },
  {
    q: 'Can the system be used in different vehicles?',
    a: 'Yes, the system can be used in a wide range of vehicles powered by diesel or gasoline, such as cars, trucks and construction machinery.',
  },
  {
    q: 'How does Fuel Eco Tech reduce emissions?',
    a: 'By using oxygen more efficiently in the air-fuel mixture, the fuel burns more completely. This results in fewer pollutants such as CO2, nitrogen oxides (NOx) and soot particles in the exhaust gases.',
  },
  {
    q: 'Does Fuel Eco Tech really save fuel?',
    a: 'Yes, tests have shown that fuel consumption can be significantly reduced by using Fuel Eco Tech, resulting in savings and an improved environmental balance.',
  },
  {
    q: 'What warranty is provided?',
    a: 'We provide a 4-year warranty on the Fuel Eco Tech System.',
  },
];

/* ────────────────────── Calculator Math (official logic) ─────────────────────── */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computePurchase(
  mode: string, annual: number, consumption: number,
  fuelPrice: number, systemCost: number, savingPct: number
) {
  const pct = clamp(savingPct, 0, 100);
  const fuelNo = mode === 'h'
    ? annual * consumption
    : (annual * consumption) / 100;
  const costNo = fuelNo * fuelPrice;
  const fuelWith = fuelNo * (1 - pct / 100);
  const costWith = fuelWith * fuelPrice;
  const yearlySaving = costNo - costWith;
  const paybackYears = yearlySaving > 0 ? systemCost / yearlySaving : Infinity;
  return { costNo, costWith, yearlySaving, paybackYears };
}

function computeRental(
  systemCost: number, downPct: number, months: number,
  ratePct: number, monthlySaving: number, costNo: number, costWith: number
) {
  const dp = systemCost * (clamp(downPct, 0, 100) / 100);
  const principal = systemCost - dp;
  const r = ratePct / 100 / 12;
  const monthly = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  const totalRental = dp + monthly * months;
  const extra = totalRental - systemCost;
  const net = monthlySaving - monthly;
  const breakEven = net > 0 ? dp / net : months;
  const totalBenefit = monthlySaving * months - totalRental;
  return { dp, principal, monthly, totalRental, extra, net, annualNet: net * 12, breakEven, totalBenefit, costNo, costWith };
}

/* ──────────────────────────── COMPONENT ──────────────────────────── */
export default function FET() {
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroVideo = 'https://fuelecotech.com/assets/video/hero/hero-desktop.mp4';

  /* FAQ accordion */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* Calculator state */
  const [calcMode, setCalcMode] = useState<'km' | 'h'>('km');
  const [financeModel, setFinanceModel] = useState<'purchase' | 'rental'>('purchase');
  const [vehicleValue, setVehicleValue] = useState('PKW');
  const [consumption, setConsumption] = useState('');
  const [annual, setAnnual] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [savingPct, setSavingPct] = useState('10');
  const [downPct, setDownPct] = useState('20');
  const [rentalDuration, setRentalDuration] = useState('24');
  const [financeRate, setFinanceRate] = useState('5');

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, [location.pathname]);

  const { eurToUgx, rate } = useExchangeRate();

  /* Convert EUR vehicle options to UGX using live rate */
  const vehicleOptions = useMemo(() => VEHICLE_OPTIONS_EUR[calcMode].map(v => ({
    ...v,
    cost: eurToUgx(v.eurPrice),
  })), [calcMode, eurToUgx]);

  const vehicleCost = vehicleOptions.find(v => v.value === vehicleValue)?.cost ?? vehicleOptions[0].cost;

  /* When mode changes, reset vehicle to first option */
  useEffect(() => {
    setVehicleValue(VEHICLE_OPTIONS_EUR[calcMode][0].value);
  }, [calcMode]);

  /* Calculator results */
  const results = useMemo(() => {
    const a = parseFloat(annual);
    const c = parseFloat(consumption);
    const fp = parseFloat(fuelPrice);
    const sp = parseFloat(savingPct);
    if (!a || !c || !fp || isNaN(sp)) return null;

    const p = computePurchase(calcMode, a, c, fp, vehicleCost, sp);

    if (financeModel === 'purchase') return { type: 'purchase' as const, ...p };

    const dp = parseFloat(downPct);
    const dur = parseInt(rentalDuration);
    const fr = parseFloat(financeRate);
    if (isNaN(dp) || !dur || isNaN(fr)) return null;

    const r = computeRental(vehicleCost, dp, dur, fr, p.yearlySaving / 12, p.costNo, p.costWith);
    return { type: 'rental' as const, ...p, rental: r };
  }, [calcMode, financeModel, vehicleValue, vehicleCost, consumption, annual, fuelPrice, savingPct, downPct, rentalDuration, financeRate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);

  const fmtPayback = (years: number) => {
    if (!isFinite(years) || years <= 0) return '\u2014';
    const months = years * 12;
    if (months < 1) return `${(months * 4.33).toFixed(0)} weeks`;
    if (months < 24) return `${months.toFixed(1)} months`;
    return `${years.toFixed(1)} years`;
  };

  /* ─────────── Testimonial carousel ─────────── */
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text transition-colors duration-500">

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 1 — HERO VIDEO                  ║
          ╚══════════════════════════════════════════╝ */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={location.pathname}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Hero Value Propositions */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">

          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { label: 'Save Fuel', icon: '⛽' },
              { label: 'Improve Engine Performance', icon: '⚡' },
              { label: 'Reduce Emissions', icon: '🌿' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + idx * 0.15 }}
                className="flex items-center gap-2.5 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-bold shadow-xl"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
            />
          </div>
          <span className="text-white/40 text-[11px] tracking-[0.3em] uppercase">Scroll</span>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 2 — APPLICATIONS                ║
          ╚══════════════════════════════════════════╝ */}
      <section id="applications" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Applications</span>
            <h2 className="text-vitorra-text leading-tight">For all vehicles &ndash; in every industry</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {APPLICATIONS.map((app, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group rounded-3xl overflow-hidden bg-vitorra-card border border-vitorra-border hover:shadow-2xl transition-all duration-500"
              >
                <div className="h-56 overflow-hidden">
                  <img src={app.img} alt={app.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {app.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-vitorra-bg border border-vitorra-border rounded-full text-[11px] font-bold text-vitorra-muted tracking-wider">
                        {tag}
                      </span>
                    ))}
                    <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-vitorra-bg border border-vitorra-border rounded-full text-[11px] font-bold text-emerald-400 tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {app.tagRight}
                    </span>
                  </div>
                  <h3 className="text-xl text-vitorra-text mb-3">{app.title}</h3>
                  <p className="text-sm text-vitorra-muted leading-relaxed">{app.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-xl text-vitorra-text mb-4">Get non-binding advice</h3>
            <p className="text-sm text-vitorra-muted max-w-xl mx-auto mb-8">
              Briefly tell us your vehicle type, mileage/operating hours and usage profile &ndash; we will get back to you with the next steps.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 px-10 py-4 bg-emerald-500 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              Go to inquiry form <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 7 — AMORTIZATION CALCULATOR     ║
          ╚══════════════════════════════════════════╝ */}
      <section id="calculator" className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Amortization</span>
            <h2 className="text-vitorra-text leading-tight">Amortization calculator</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* — Inputs — */}
            <div className="lg:col-span-7 p-8 md:p-10 rounded-3xl bg-vitorra-card border border-vitorra-border">
              <h3 className="text-lg font-bold text-vitorra-text mb-8">Your inputs</h3>

              <div className="space-y-6">
                {/* Mode */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Mode</label>
                  <select
                    value={calcMode}
                    onChange={e => setCalcMode(e.target.value as 'km' | 'h')}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  >
                    <option value="km">Kilometers (l/100 km)</option>
                    <option value="h">Operating hours (l/h)</option>
                  </select>
                </div>

                {/* Financing Model */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Financing model</label>
                  <select
                    value={financeModel}
                    onChange={e => setFinanceModel(e.target.value as 'purchase' | 'rental')}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="rental">Rental</option>
                  </select>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Vehicle type</label>
                  <select
                    value={vehicleValue}
                    onChange={e => setVehicleValue(e.target.value)}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  >
                    {vehicleOptions.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Consumption */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">
                    {calcMode === 'h' ? 'Consumption (l/h)' : 'Consumption (l/100 km)'}
                  </label>
                  <input
                    type="number"
                    value={consumption}
                    onChange={e => setConsumption(e.target.value)}
                    placeholder={calcMode === 'h' ? 'e.g. 45' : 'e.g. 11.5'}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>

                {/* Annual mileage / hours */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">
                    {calcMode === 'h' ? 'Annual operating hours (h/year)' : 'Annual mileage (km/year)'}
                  </label>
                  <input
                    type="number"
                    value={annual}
                    onChange={e => setAnnual(e.target.value)}
                    placeholder={calcMode === 'h' ? 'e.g. 900' : 'e.g. 35,000'}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>

                {/* Fuel price */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Fuel price (UGX/l)</label>
                  <input
                    type="number"
                    value={fuelPrice}
                    onChange={e => setFuelPrice(e.target.value)}
                    placeholder="e.g. 5400"
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>

                {/* FET Cost (auto) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">FET cost (UGX)</label>
                  <input
                    type="text"
                    readOnly
                    value={fmt(vehicleCost)}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-muted outline-none cursor-not-allowed"
                  />
                </div>

                {/* Savings % */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Fuel savings (%)</label>
                  <input
                    type="number"
                    value={savingPct}
                    onChange={e => setSavingPct(e.target.value)}
                    className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>

                {/* Rental-only fields */}
                {financeModel === 'rental' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Down payment (%)</label>
                      <input
                        type="number" value={downPct} onChange={e => setDownPct(e.target.value)}
                        className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Rental duration (max. 48 months)</label>
                      <input
                        type="number" min={1} max={48} value={rentalDuration} onChange={e => setRentalDuration(e.target.value)}
                        className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-vitorra-muted mb-2">Finance rate p.a. (%)</label>
                      <input
                        type="number" value={financeRate} onChange={e => setFinanceRate(e.target.value)}
                        className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-4 py-3.5 text-sm text-vitorra-text outline-none focus:border-vitorra-gold transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* — Results — */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 relative overflow-hidden">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block mb-6">Result</span>

                {results ? (
                  <div className="space-y-6">
                    {/* Big number */}
                    <div>
                      <div className="text-3xl md:text-4xl font-bold text-vitorra-text mb-1">
                        {results.type === 'purchase'
                          ? fmt(results.yearlySaving)
                          : fmt(results.rental!.net)
                        }
                      </div>
                      <div className="text-sm text-vitorra-muted">
                        {results.type === 'purchase' ? 'Annual savings' : 'Monthly net benefit'}
                      </div>
                    </div>

                    {/* Payback / Break-even */}
                    <div className="p-5 rounded-2xl bg-vitorra-bg/50 border border-vitorra-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">
                          {results.type === 'purchase' ? 'Payback' : 'Rental break-even'}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400 font-bold">&bull; Time</span>
                      </div>
                      <div className="text-xl font-bold text-vitorra-text">
                        {results.type === 'purchase'
                          ? fmtPayback(results.paybackYears)
                          : `${results.rental!.breakEven.toFixed(1)} months`
                        }
                      </div>
                    </div>

                    {/* Cost with / without */}
                    <div className="p-5 rounded-2xl bg-vitorra-bg/50 border border-vitorra-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">
                          {results.type === 'purchase' ? 'Cost/year' : 'Rental payment/month'}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400 font-bold">
                          &bull; {results.type === 'purchase' ? 'without / with' : 'per month'}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-vitorra-text">
                        {results.type === 'purchase'
                          ? `${fmt(results.costNo)} / ${fmt(results.costWith)}`
                          : fmt(results.rental!.monthly)
                        }
                      </div>
                    </div>

                    {/* Rental details panel */}
                    {results.type === 'rental' && results.rental && (
                      <div className="p-5 rounded-2xl bg-vitorra-bg/50 border border-vitorra-border space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted block mb-2">Rental details</span>
                        {[
                          ['Down payment', fmt(results.rental.dp)],
                          ['Amount to finance', fmt(results.rental.principal)],
                          ['Annual net benefit', fmt(results.rental.annualNet)],
                          ['Total rental cost', fmt(results.rental.totalRental)],
                          ['Extra cost vs. purchase', fmt(results.rental.extra)],
                          ['Total benefit over term', fmt(results.rental.totalBenefit)],
                          ['Cost/year without / with', `${fmt(results.rental.costNo)} / ${fmt(results.rental.costWith)}`],
                        ].map(([label, val], i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-vitorra-muted">{label}</span>
                            <span className="text-vitorra-text font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="text-3xl font-bold text-vitorra-muted/30">&mdash;</div>
                      <div className="text-sm text-vitorra-muted">Annual savings</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-vitorra-bg/50 border border-vitorra-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">Payback</span>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400 font-bold">&bull; Time</span>
                      </div>
                      <div className="text-xl font-bold text-vitorra-muted/30">&mdash;</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-vitorra-bg/50 border border-vitorra-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">Cost/year</span>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400 font-bold">&bull; without / with</span>
                      </div>
                      <div className="text-xl font-bold text-vitorra-muted/30">&mdash; / &mdash;</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 3 — ADVANTAGES                  ║
          ╚══════════════════════════════════════════╝ */}
      <section id="advantages" className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Advantages</span>
            <h2 className="text-vitorra-text leading-tight">short &amp; concise</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map((adv, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="p-8 rounded-3xl bg-vitorra-card border border-vitorra-border hover:border-vitorra-gold/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-vitorra-text mb-3">{adv.title}</h3>
                <p className="text-sm text-vitorra-muted leading-relaxed">{adv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 4 — EVIDENCE                    ║
          ╚══════════════════════════════════════════╝ */}
      <section id="evidence" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Evidence</span>
            <h2 className="text-vitorra-text leading-tight">Selected results &amp; context</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Unimog field test */}
            <div className="p-8 md:p-10 rounded-3xl bg-vitorra-card border border-vitorra-border">
              <h3 className="text-xl font-bold text-vitorra-text mb-4">Unimog &ndash; Consumption per operating hour</h3>
              <p className="text-sm text-vitorra-muted leading-relaxed mb-8">
                Field test logic: comparison against a reference over a period of time. Reported winter reduction: <strong className="text-vitorra-text">~10.9%</strong> per operating hour.
              </p>
              <div className="p-6 rounded-2xl bg-vitorra-bg border border-vitorra-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">Winter Operation</span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-[11px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />l/Bh
                  </span>
                </div>
                <div className="text-5xl font-bold text-vitorra-text">10.9%</div>
              </div>
            </div>

            {/* Lab test */}
            <div className="p-8 md:p-10 rounded-3xl bg-vitorra-card border border-vitorra-border">
              <h3 className="text-xl font-bold text-vitorra-text mb-4">Lab test &ndash; Constant-speed runs</h3>
              <p className="text-sm text-vitorra-muted leading-relaxed mb-8">
                In the published lab test, savings of <strong className="text-vitorra-text">up to 15%</strong> are stated for constant-speed runs.
              </p>
              <div className="p-6 rounded-2xl bg-vitorra-bg border border-vitorra-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">Constant-Speed Run (Max.)</span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-[11px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Lab
                  </span>
                </div>
                <div className="text-5xl font-bold text-vitorra-text">15%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 5 — CUSTOMER TESTIMONIALS       ║
          ╚══════════════════════════════════════════╝ */}
      <section id="customers" className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">What our customers say</span>
            <h2 className="text-vitorra-text leading-tight">Experiences from everyday use &amp; fleet operations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.slice(0, 4).map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-vitorra-card border border-vitorra-border"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted block mb-6">{t.vehicle}</span>
                <p className="text-vitorra-text leading-relaxed mb-8">{t.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-vitorra-border">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-vitorra-text">{t.name}</div>
                    <div className="text-[11px] text-vitorra-muted">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rotating additional testimonials */}
          <div className="mt-8 p-8 rounded-3xl bg-vitorra-card border border-vitorra-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col md:flex-row items-start gap-6"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-vitorra-border shrink-0">
                  <img src={TESTIMONIALS[testimonialIdx].img} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted block mb-3">
                    {TESTIMONIALS[testimonialIdx].vehicle}
                  </span>
                  <p className="text-vitorra-text leading-relaxed mb-3">{TESTIMONIALS[testimonialIdx].quote}</p>
                  <div className="text-sm font-bold text-vitorra-muted">{TESTIMONIALS[testimonialIdx].name} &middot; {TESTIMONIALS[testimonialIdx].role}</div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-emerald-400 w-6' : 'bg-vitorra-border'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 6 — NEWS                        ║
          ╚══════════════════════════════════════════╝ */}
      <section id="news" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-emerald-400 text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">News</span>
            <h2 className="text-vitorra-text leading-tight">Lab, tests &amp; updates</h2>
          </div>

          <Link to="/news/fet-lab-test" className="group block">
            <div className="rounded-3xl overflow-hidden bg-vitorra-card border border-vitorra-border hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-500">
              <div className="h-72 md:h-96 overflow-hidden">
                <img
                  src="https://fuelecotech.com/assets/img/news/labortest.jpg"
                  alt="FET System laboratory test — Mercedes on dynamometer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <span className="inline-block px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full text-[11px] font-bold text-emerald-400 tracking-[0.2em] uppercase mb-5">
                  FET System Impresses in Lab Test
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-vitorra-text mb-4 group-hover:text-emerald-400 transition-colors">
                  Significant savings during constant-speed driving
                </h3>
                <p className="text-sm text-vitorra-muted leading-relaxed mb-6">
                  The published article describes a standardized WLTC and constant-speed test. The potential is particularly evident at steady speeds &ndash; up to 15% savings during constant-speed driving.
                </p>
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-vitorra-bg border border-vitorra-border rounded-full text-sm font-bold text-vitorra-text group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all">
                  Read more
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 8 — ABOUT                       ║
          ╚══════════════════════════════════════════╝ */}
      <section id="about" className="py-24 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">About Us</span>
            <h2 className="text-vitorra-text leading-tight">Fuel Eco Tech &ndash; Efficiency that matters in daily operations</h2>
          </div>

          <div className="p-8 md:p-10 rounded-3xl bg-vitorra-card border border-vitorra-border">
            <h3 className="text-xl font-bold text-vitorra-text mb-4">What we stand for</h3>
            <p className="text-vitorra-muted leading-relaxed mb-8 max-w-3xl">
              FET system means one thing to us: clear results, traceable context and clean implementation. That is why we combine lab tests, field reports and customer feedback into one consistent story &ndash; for serious market communication.
            </p>
          </div>


        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║  SECTION 9 — FAQ                         ║
          ╚══════════════════════════════════════════╝ */}
      <section id="faq" className="py-24 md:py-32 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <span className="text-vitorra-muted text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">FAQ</span>
            <h2 className="text-vitorra-text leading-tight">Short &amp; easy to understand</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div key={idx} className="rounded-2xl bg-vitorra-card border border-vitorra-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-8 py-5 text-left group"
                >
                  <span className="text-vitorra-text font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-vitorra-muted shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-6 text-sm text-vitorra-muted leading-relaxed">
                        {faq.a}
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
          ║  SECTION 10 — INQUIRY CTA                ║
          ╚══════════════════════════════════════════╝ */}
      <section className="py-32 bg-vitorra-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="p-16 rounded-[3rem] bg-vitorra-card border border-vitorra-border relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
              <h2 className="mb-6 text-vitorra-text relative z-10">Get in touch</h2>
              <p className="text-vitorra-muted max-w-xl mx-auto mb-10 relative z-10">
                Briefly tell us your vehicle type, mileage/operating hours and usage profile &ndash; we will get back to you with the next steps.
              </p>
              <Link
                to="/contact"
                className="relative z-10 inline-flex items-center gap-3 px-12 py-5 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all duration-300 uppercase tracking-widest text-sm shadow-2xl shadow-emerald-500/20"
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
