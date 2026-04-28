import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  Ship,
  Plane,
  Package,
  Map,
  ShieldCheck,
  Clock,
  BarChart3,
  ArrowRight,
  Database,
  Globe,
  Gauge,
  Activity,
  Navigation,
  Weight,
  Scale,
  Calendar,
  User,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FLEET_IMAGES = [
  { src: "/images/logistics_fleet.png", alt: "Vitorra Fleet on Highway", label: "Fleet Operations" },
  { src: "/images/fleet_convoy.png", alt: "Logistics Convoy", label: "Regional Distribution" },
  { src: "/images/fleet_depot.png", alt: "Logistics Depot", label: "Warehouse & Loading" },
];

export default function Logistics() {

  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    origin: '',
    destination: '',
    type: 'General Cargo',
    weight: '',
    requirements: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In a real app, this would send data to a backend or CMS
    console.log('Shipment Inquiry Received:', formState);
  };

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text pb-16 transition-colors duration-500 font-sans">
      {/* Hero */}
      <section className="relative min-h-[60vh] md:min-h-screen flex items-center overflow-hidden bg-vitorra-bg pt-32 md:pt-48 pb-12 md:pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[50%] overflow-hidden">
            <img
              src="/images/logistics_hero.png"
              alt="Vitorra Logistics Fleet"
              className="w-full h-full object-cover opacity-30 md:opacity-100 transition-all duration-700"
            />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mb-8 md:mb-40">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vitorra-gold/10 backdrop-blur-md border border-vitorra-gold/20 mb-8 font-sans">
              <div className="w-1.5 h-1.5 rounded-full bg-vitorra-gold animate-pulse" />
              <span className="text-vitorra-gold text-[11px] font-black tracking-[0.25em] uppercase">Global Supply Chain Architecture</span>
            </div>
            <h1 className="text-3xl md:text-5xl mb-6 md:mb-8">
              East Africa's <br />
              <span className="text-vitorra-gold">Logistics Gateway.</span>
            </h1>
            <p className="text-sm md:text-base text-vitorra-text/70 mb-8 md:mb-10 max-w-lg leading-relaxed font-normal whitespace-pre-line">
              Streamlining global trade through advanced infrastructure and operational excellence. 
              Connecting regional markets to the world with unparalleled precision.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/contact" className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-lg hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-vitorra-gold/20 flex items-center gap-2">
                Get Quote Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Strategic Hubs Section */}
      <section id="verticals" className="py-20 md:py-32 bg-vitorra-bg border-b border-vitorra-border/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-24">
            <div className="flex items-center justify-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
              <Globe className="w-5 h-5" />
              Digital Ecosystem
            </div>
            <h2 className="text-2xl md:text-4xl mb-6 md:mb-10 text-vitorra-text leading-tight">Smart Supply Chain & <br />Logistics Platform</h2>
            <p className="text-base md:text-lg text-vitorra-muted max-w-2xl mx-auto leading-relaxed">
              We are developing a digital platform that efficiently matches logistics and transport service providers 
              with businesses and consumers, making it easier to find, book, and manage reliable delivery services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {FLEET_IMAGES.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="rounded-2xl overflow-hidden border border-vitorra-border hover:border-vitorra-gold/30 transition-all group shadow-xl relative"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <span className="text-xs font-bold uppercase tracking-widest text-vitorra-gold">{img.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tire Solutions Deep Dive */}
      <section className="py-20 md:py-32 bg-vitorra-bg-alt border-b border-vitorra-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-[11px] font-bold">
                <Database className="w-5 h-5" />
                Digital Transport Focus
              </div>
              <h2 className="text-2xl md:text-4xl mb-6 md:mb-10 text-vitorra-text leading-tight">E-Ticketing Platform <br />for Uganda.</h2>
              <p className="text-base md:text-lg text-vitorra-muted leading-relaxed mb-8 md:mb-12">
                Vitorra Holdings is embarking on the digital transformation of Uganda’s transport industry 
                by developing a secure and scalable e-ticketing platform.
              </p>

              <div className="space-y-6">
                {[
                  "Enable digital ticket purchases",
                  "Improve scheduling transparency",
                  "Reduce cash handling risks",
                  "Support nationwide and regional travel management",
                  "Improve passenger experience"
                ].map((point, i) => (
                  <div key={i} className="flex items-center gap-4 text-vitorra-text/70">
                    <ShieldCheck className="w-5 h-5 text-vitorra-gold" />
                    <span className="text-sm font-sans tracking-wide">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative group">
              <div className="absolute -inset-20 bg-vitorra-gold/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative p-3 md:p-4 rounded-[3rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="rounded-[2rem] overflow-hidden">
                  <img
                    src="/images/eticketing_platform.png"
                    alt="E-Ticketing Platform for Uganda"
                    className="w-full h-auto transition-all duration-1000 group-hover:scale-105"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Shipment Inquiry Section - For Market Data Collection */}
      <section id="inquiry" className="py-20 md:py-32 bg-vitorra-bg-alt border-t border-vitorra-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 text-vitorra-gold mb-6 uppercase tracking-[0.2em] text-xs font-bold">
                <Navigation className="w-5 h-5" />
                Platform Integration Request
              </div>
              <h2 className="text-2xl md:text-4xl">Request Digital <br />Platform Architecture.</h2>
              <p className="text-base md:text-lg text-vitorra-muted leading-relaxed mb-8 md:mb-12">
                Submit your requirements to join our digital logistics network. This platform will empower traders, SMEs, and regional businesses 
                to move goods efficiently, strengthening intra-African commerce and supporting economic integration.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-vitorra-text font-bold uppercase tracking-widest text-[11px] mb-2">Standardized Pricing</h4>
                    <p className="text-sm text-vitorra-muted leading-relaxed">Transparent kilometer-based pricing and automated distance calculations ensuring fair rate structures.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-vitorra-text font-bold uppercase tracking-widest text-[11px] mb-2">Real-time Visibility</h4>
                    <p className="text-sm text-vitorra-muted leading-relaxed">Improved cargo tracking visibility and real-time booking functionality for verified commercial entities.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="relative p-1 bg-gradient-to-br from-vitorra-gold/20 to-vitorra-border/20 rounded-[3rem]">
                <div className="bg-vitorra-card p-10 md:p-12 rounded-[2.85rem] border border-vitorra-border shadow-2xl relative overflow-hidden">
                  {isSubmitted ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                      <div className="w-20 h-20 bg-vitorra-gold/10 rounded-full flex items-center justify-center text-vitorra-gold mx-auto mb-8">
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                      <h3 className="text-3xl font-serif text-vitorra-text mb-4">Request Logged</h3>
                      <p className="text-vitorra-muted mb-10">Our infrastructure team will analyze your route requirements and reach out via our technical desk.</p>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="text-vitorra-gold font-bold uppercase tracking-[0.2em] text-[11px] hover:text-vitorra-text transition-colors"
                      >
                        File New Shipment Inquiry
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <User className="w-3 h-3" /> Full Name
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all"
                            placeholder="John Doe"
                            value={formState.fullName}
                            onChange={(e) => setFormState({...formState, fullName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Business Email
                          </label>
                          <input 
                            required
                            type="email" 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all"
                            placeholder="j.doe@company.com"
                            value={formState.email}
                            onChange={(e) => setFormState({...formState, email: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <Map className="w-3 h-3" /> Origin
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all"
                            placeholder="Kampala, Uganda"
                            value={formState.origin}
                            onChange={(e) => setFormState({...formState, origin: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <Navigation className="w-3 h-3" /> Destination
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all"
                            placeholder="Mombasa, Kenya"
                            value={formState.destination}
                            onChange={(e) => setFormState({...formState, destination: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <Ship className="w-3 h-3" /> Cargo Type
                          </label>
                          <select 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all appearance-none"
                            value={formState.type}
                            onChange={(e) => setFormState({...formState, type: e.target.value})}
                          >
                            <option>General Cargo</option>
                            <option>Medical Cold Chain</option>
                            <option>Industrial JIT</option>
                            <option>Hazardous / Secure</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-vitorra-muted flex items-center gap-2">
                            <Weight className="w-3 h-3" /> Estimated Weight
                          </label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all"
                            placeholder="500 KG"
                            value={formState.weight}
                            onChange={(e) => setFormState({...formState, weight: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-vitorra-muted">Additional Information</label>
                        <textarea 
                          rows={4}
                          className="w-full bg-vitorra-bg border border-vitorra-border rounded-xl px-5 py-3 text-sm focus:border-vitorra-gold/50 outline-none transition-all resize-none"
                          placeholder="Describe your shipment requirements..."
                          value={formState.requirements}
                          onChange={(e) => setFormState({...formState, requirements: e.target.value})}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-vitorra-gold text-vitorra-gold-text font-bold py-5 rounded-xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 uppercase tracking-widest text-xs shadow-xl shadow-vitorra-gold/20"
                      >
                        Register Shipping Inquiry
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


    </div>
  );
}
