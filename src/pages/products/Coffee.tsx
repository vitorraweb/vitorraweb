import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Leaf,
  Coffee as CoffeeIcon,
  Package,
  FileText,
  Globe,
  TrendingUp,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const COFFEE_GRADES = [
  {
    name: 'Arabica Export Grade 1',
    description:
      'High-quality beans with minimal defects, delivering a clean cup profile and reliable export performance.',
    color: 'from-vitorra-gold/20 to-transparent',
  },
  {
    name: 'Arabica Specialty G1',
    description:
      'Premium-grade coffee with distinctive flavor notes, ideal for specialty roasters and high-end markets.',
    color: 'from-amber-600/20 to-transparent',
  },
  {
    name: 'Commercial Arabica & Robusta',
    description:
      'Consistent and cost-effective beans suitable for large-scale production while maintaining solid flavor integrity.',
    color: 'from-stone-700/20 to-transparent',
  },
];

const WHY_CHOOSE = [
  { text: 'Fair trade coming soon — ethical sourcing guaranteed', icon: <ShieldCheck className="w-5 h-5" /> },
  { text: 'The Best quality sourced from top Ugandan regions', icon: <CheckCircle className="w-5 h-5" /> },
  { text: 'Strict grading and quality control processes', icon: <Package className="w-5 h-5" /> },
  { text: 'Reliable bulk export capabilities', icon: <Globe className="w-5 h-5" /> },
  { text: 'Traceable and sustainably sourced coffee', icon: <Search className="w-5 h-5" /> },
  { text: 'Competitive pricing for global buyers', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function Coffee() {
  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text pb-16 transition-colors duration-500 font-sans">

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-vitorra-bg pt-48 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[50%] overflow-hidden">
            <img
              src="/images/coffee_garden_new.png"
              alt="Ugandan Coffee Highlands"
              className="w-full h-full object-cover opacity-100 transition-all duration-700"
            />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mb-20 md:mb-40">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <img src="/images/fair-trade-logo.png" alt="Fair Trade Certified" className="w-16 h-16 object-contain drop-shadow-lg" />
              <span className="text-sm font-bold text-vitorra-gold uppercase tracking-widest">Fair Trade Coming Soon</span>
            </div>
            <h1 className="mb-8">
              Experience the Ugandan <br />
              <span className="text-vitorra-gold">Arabica and Robusta Coffee</span>
            </h1>
            <p className="text-vitorra-text/70 mb-6 max-w-xl leading-relaxed font-normal">
              Vitorra is proud to bring Uganda's rich coffee heritage to international markets, unlocking new opportunities across Germany, Croatia, the Netherlands, and Belgium.
            </p>
            <p className="text-vitorra-text/70 mb-10 max-w-xl leading-relaxed font-normal">
              With access to a potential consumer base of over 7 million people, we are building structured export channels that connect Ugandan coffee producers directly to global buyers—ensuring quality, traceability, and sustainable growth for all partners.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/contact" className="px-8 py-3.5 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 flex items-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-vitorra-gold/20">
                Begin Your Coffee Journey <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — CULTIVATED FOR CHARACTER
          ═══════════════════════════════════════════ */}
      <section className="py-32 bg-vitorra-bg border-b border-vitorra-border/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
                <Leaf className="w-5 h-5" />
                Origin & Quality
              </div>
              <h2 className="mb-10 text-vitorra-text leading-tight">Cultivated for <br />Character.</h2>
              <p className="text-lg text-vitorra-muted leading-relaxed">
                Every bean tells a story of its origin. Our coffee is carefully grown under optimal climatic conditions, allowing it to develop a unique character defined by depth, aroma, and balance. Through responsible farming and selective harvesting, we ensure each batch meets premium standards.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative group">
              <div className="absolute -inset-20 bg-vitorra-gold/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative p-3 md:p-4 rounded-[3rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="rounded-[2rem] overflow-hidden">
                  <img src="/images/coffee_beans.png" alt="Ugandan Coffee Beans" className="w-full h-auto grayscale-[15%] group-hover:grayscale-0 transition-all duration-[2000ms]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — SOURCING & COFFEE GRADES
          ═══════════════════════════════════════════ */}
      <section className="py-32 bg-vitorra-bg-alt border-b border-vitorra-border transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="flex items-center justify-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
              <CoffeeIcon className="w-5 h-5" />
              Sourcing &amp; Coffee Grades
            </div>
            <h2 className="mb-6 text-vitorra-text text-center">Our Coffee Grades</h2>
            <div className="w-24 h-px bg-vitorra-gold mx-auto mb-8" />
            <p className="text-vitorra-muted max-w-3xl mx-auto text-lg leading-relaxed">
              We specialize in sourcing high-quality Arabica &amp; Robusta coffee from Uganda's leading coffee regions with a structured grading system to ensure consistency, quality assurance, and compliance with international export standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COFFEE_GRADES.map((grade, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-vitorra-card border border-vitorra-border hover:border-vitorra-gold/30 transition-all group shadow-xl overflow-hidden relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${grade.color} opacity-30`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold mb-6">
                    <CoffeeIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl text-vitorra-text mb-4">{grade.name}</h3>
                  <p className="text-sm text-vitorra-muted leading-relaxed mb-8">{grade.description}</p>
                  <Link to="/contact" className="w-full inline-flex items-center justify-center gap-2 py-3 bg-vitorra-bg/5 text-vitorra-text font-bold rounded-xl hover:bg-vitorra-gold hover:text-black transition-all duration-300 uppercase tracking-widest text-[9px] border border-vitorra-border group-hover:border-vitorra-gold/50">
                    Begin Your Coffee Journey
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — WHY CHOOSE OUR COFFEE
          ═══════════════════════════════════════════ */}
      <section className="py-32 bg-vitorra-bg border-b border-vitorra-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-6 text-vitorra-text">Why Choose Our Coffee</h2>
            <div className="w-24 h-px bg-vitorra-gold mx-auto" />
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {WHY_CHOOSE.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex items-center gap-6 p-6 rounded-2xl bg-vitorra-card border border-vitorra-border hover:border-vitorra-gold/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold shrink-0">
                  {item.icon}
                </div>
                <span className="text-vitorra-text font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — BULK EXPORT SOLUTIONS
          ═══════════════════════════════════════════ */}
      <section className="py-32 bg-vitorra-bg-alt border-b border-vitorra-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
                <Globe className="w-5 h-5" />
                Global Distribution
              </div>
              <h2 className="mb-10 text-vitorra-text leading-tight">Bulk Export <br />Solutions</h2>
              <p className="text-lg text-vitorra-muted leading-relaxed mb-12">
                We provide seamless bulk coffee export services tailored to international buyers. Whether you require specialty lots or large commercial volumes, our logistics and supply chain ensure timely and efficient delivery.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 uppercase tracking-widest text-[10px] shadow-xl shadow-vitorra-gold/20">
                Begin Your Coffee Journey <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="p-10 rounded-[2rem] bg-vitorra-card border border-vitorra-border">
                <div className="flex items-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
                  <FileText className="w-5 h-5" />
                  Specifications &amp; Documentation
                </div>
                <p className="text-vitorra-muted leading-relaxed mb-8">
                  Access detailed product specifications including bean size, moisture content, grading details, and export certifications. We provide full transparency to help you make informed purchasing decisions.
                </p>
                <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-3.5 bg-vitorra-bg/5 border border-vitorra-border text-vitorra-text font-bold rounded-xl hover:bg-vitorra-gold hover:text-black hover:border-vitorra-gold transition-all duration-300 uppercase tracking-widest text-[10px]">
                  Begin Your Coffee Journey <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — FINAL CTA
          ═══════════════════════════════════════════ */}
      <section className="py-40 bg-vitorra-bg border-t border-vitorra-border transition-colors duration-500">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="p-16 md:p-20 rounded-[3rem] bg-vitorra-card border border-vitorra-border relative overflow-hidden shadow-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-vitorra-gold/5 blur-[120px] rounded-full pointer-events-none" />
              <h2 className="mb-8 text-vitorra-text relative z-10">
                Scale your coffee supply with a trusted partner rooted in Uganda's rich coffee heritage.
              </h2>
              <div className="w-24 h-px bg-vitorra-gold mx-auto mb-10" />
              <Link
                to="/contact"
                className="relative z-10 inline-flex items-center gap-3 px-12 py-5 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-2xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 uppercase tracking-widest text-sm shadow-2xl shadow-vitorra-gold/20"
              >
                Begin Your Coffee Journey <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Footer Note */}
            <p className="mt-12 text-sm text-vitorra-muted/50 tracking-widest uppercase">
              © Premium Ugandan Coffee Exporters &nbsp;|&nbsp; Quality &bull; Traceability &bull; Excellence
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
