import { motion } from 'motion/react';
import { Target, Eye, Shield, Globe, ArrowRight, Smartphone, Coffee, ShieldCheck } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export default function About() {
  const { state } = useCMS();
  const { pageContent, coreValues } = state;

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text pb-16 font-sans transition-colors duration-500">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-vitorra-bg pt-48 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[50%] overflow-hidden">
            <img
              src="/images/about_hero_highres.png"
              alt="Vitorra Boardroom"
              className="w-full h-full object-cover opacity-100 transition-all duration-700"
            />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mb-20 md:mb-40">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vitorra-gold/10 backdrop-blur-md border border-vitorra-gold/20 mb-8 font-sans">
              <div className="w-1.5 h-1.5 rounded-full bg-vitorra-gold animate-pulse" />
              <span className="text-vitorra-gold text-[10px] font-black tracking-[0.25em] uppercase">Our Story</span>
            </div>
            <h1 className="mb-8">
              {pageContent.aboutHeroTitle} <br />
              <span className="text-vitorra-gold">{pageContent.aboutHeroSubtitle}</span>
            </h1>
            <p className="text-vitorra-text/70 mb-12 max-w-lg leading-relaxed font-normal">
              {pageContent.aboutHeroDescription}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="p-8 md:p-10 rounded-2xl bg-vitorra-bg border border-vitorra-border"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl text-vitorra-text">{pageContent.missionTitle}</h3>
              </div>
              <p className="text-lg text-vitorra-muted leading-relaxed">
                {pageContent.missionDescription}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="p-8 md:p-10 rounded-2xl bg-vitorra-bg border border-vitorra-border"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-vitorra-gold/10 flex items-center justify-center text-vitorra-gold">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-xl text-vitorra-text">{pageContent.visionTitle}</h3>
              </div>
              <p className="text-lg text-vitorra-muted leading-relaxed">
                {pageContent.visionDescription}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Vitorra Blueprint */}
      <section className="py-24 bg-vitorra-bg border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="mb-10 text-vitorra-text leading-tight">The Vitorra <br />Blueprint.</h2>
            <div className="w-24 h-px bg-vitorra-gold mx-auto mb-10" />
            <p className="text-xl md:text-2xl text-vitorra-muted leading-relaxed font-light italic">
              "We are a forward-thinking company delivering innovative technologies and dependable logistics solutions to international markets."
            </p>
          </div>
        </div>
      </section>

      {/* Operational Pillars */}
      <section className="py-32 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <span className="text-vitorra-gold text-[10px] font-black tracking-[0.2em] uppercase mb-4 block">Core Infrastructure</span>
            <h2 className="text-3xl md:text-4xl font-serif text-vitorra-text">Operational Pillars</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Digital Transport",
                description: "Pioneering the digital transformation of East African mobility through secure e-ticketing platforms and smart supply chain ecosystems.",
                icon: <Smartphone className="w-8 h-8" />,
                details: "Scalable E-Ticketing and Real-time Logistics Management."
              },
              {
                title: "Vitorra Coffee",
                description: "Direct export of Ugandan Coffee, leveraging specialized micro-climate analysis to deliver the pinnacle of the region's harvest.",
                icon: <Coffee className="w-8 h-8" />,
                details: "High-altitude specialty exports and terroir-driven sourcing."
              },
              {
                title: "Impact Technology",
                description: "Deploying globally tested industrial solutions, from medical hemostatics (SEAL) to fuel-efficiency and emission optimization (FET).",
                icon: <ShieldCheck className="w-8 h-8" />,
                details: "Solving regional challenges through global innovation."
              }
            ].map((pillar, idx) => (
              <div key={idx} className="p-8 md:p-10 rounded-2xl bg-vitorra-card border border-vitorra-border hover:shadow-2xl transition-all duration-500 group">
                <div className="w-14 h-14 rounded-xl bg-vitorra-bg/5 backdrop-blur-md flex items-center justify-center text-vitorra-gold mb-8 border border-vitorra-border group-hover:bg-vitorra-gold group-hover:text-vitorra-bg transition-colors duration-500">
                  {pillar.icon}
                </div>
                <h3 className="text-xl md:text-2xl text-vitorra-text mb-6">{pillar.title}</h3>
                <p className="text-vitorra-muted leading-relaxed mb-8">{pillar.description}</p>
                <div className="text-[10px] font-bold uppercase tracking-widest text-vitorra-gold/60 border-t border-vitorra-border pt-6">
                  {pillar.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Reach */}
      <section className="py-24 bg-vitorra-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-4 bg-vitorra-gold/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative max-w-sm rounded-2xl overflow-hidden">
                <img src="/images/globe_corporate.png" alt="Global Reach" className="w-full h-auto transition-all duration-[2000ms] group-hover:scale-105" />
              </div>
            </div>
            <div>
              <h2 className="mb-8 text-vitorra-text">Regional Roots, <br />Global Standards.</h2>
              <p className="text-vitorra-muted text-lg leading-relaxed mb-10">
                While our operations are centered in Kampala, our reach is global. Vitorra Holdings implements 
                rigorous international standards across all subsidiaries, ensuring that 'Made in Uganda' 
                is synonymous with world-class quality and operational reliability.
              </p>
              <div className="grid grid-cols-2 gap-12">
                {[
                  { label: "Markets Served", val: "15+" },
                  { label: "Active Portfolios", val: "4+" },
                  { label: "Regional Hubs", val: "EAC-Wide" },
                  { label: "Standard", val: "ISO-Aligned" }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div translate="no" className="text-vitorra-gold text-3xl font-serif">{stat.val}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-vitorra-muted/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
