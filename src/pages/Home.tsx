import { motion } from 'motion/react';
import { ArrowRight, Globe, ShieldCheck, Leaf, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';

const iconMap: Record<string, any> = { Globe, ShieldCheck, Leaf, Truck };

export default function Home() {
  const { state } = useCMS();
  const { pageContent, products, stats } = state;

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-screen flex items-center overflow-hidden bg-vitorra-bg pt-32 md:pt-48 pb-12 md:pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[50%] overflow-hidden">
            <img
              src={pageContent.homeHeroImage || "/images/padre_pio_house.png"}
              alt="Padre Pio House Kampala"
              className="w-full h-full object-cover opacity-30 md:opacity-100 transition-all duration-700"
            />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mb-8 md:mb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >


            <h1 className="text-3xl md:text-5xl mb-6 md:mb-8">
              {pageContent.homeHeroTitle} <br />
              <span className="text-vitorra-gold font-bold">{pageContent.homeHeroSubtitle.split(' ').map((word: string, i: number) => (<span key={i}>{i > 0 && <br />}{word}</span>))}</span>
            </h1>

            <p className="text-sm md:text-base text-vitorra-text/70 mb-8 md:mb-10 max-w-xl leading-relaxed font-normal whitespace-pre-line">
              {pageContent.homeHeroDescription}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-all duration-300 uppercase tracking-[0.15em] text-xs shadow-xl shadow-vitorra-gold/25">
                Explore Vitorra
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Ecosystem (Bento Grid) */}
      <section className="py-16 md:py-24 bg-vitorra-bg-alt border-t border-vitorra-border transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
            <div>
              <h2 className="text-2xl md:text-4xl mb-4 md:mb-6">{pageContent.ecosystemTitle}</h2>
              <div className="w-24 h-px bg-vitorra-gold" />
            </div>
            <p className="text-vitorra-muted max-w-md text-base md:text-lg whitespace-pre-line">
              {pageContent.ecosystemDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[260px] md:auto-rows-[320px]">
            {products.map((p) => {
              const IconComponent = iconMap[p.icon] || Globe;
              return (
                <Link 
                  key={p.id} 
                  to={p.path} 
                  className={`group flex flex-col rounded-2xl overflow-hidden bg-vitorra-card shadow-sm hover:shadow-xl transition-all duration-500 border border-vitorra-border ${p.type === 'wide' ? 'lg:col-span-2' : ''}`}
                >
                  <div className="relative h-[70%] overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                    <div className="absolute top-6 left-6">
                      <div className="w-10 h-10 bg-vitorra-bg/90 backdrop-blur-md rounded-xl flex items-center justify-center text-vitorra-gold border border-vitorra-border/50 shadow-lg">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex flex-col justify-center flex-1">
                    <h3 className="text-lg text-vitorra-text mb-1">{p.name}</h3>
                    <p className="text-vitorra-text/70 text-xs line-clamp-1 leading-relaxed">{p.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Reach — now CMS-driven */}
      <section className="py-16 md:py-24 bg-vitorra-bg border-t border-vitorra-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-4xl font-serif mb-6 md:mb-8 text-vitorra-text">{pageContent.globalImpactTitle}</h2>
          <p className="text-vitorra-muted max-w-2xl mx-auto text-base md:text-lg mb-10 md:mb-16">
            {pageContent.globalImpactDescription}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.map((item, i) => (
              <div key={i} className="p-4 md:p-6 rounded-2xl bg-vitorra-bg/5 backdrop-blur-md border border-vitorra-border shadow-sm">
                <div translate="no" className="text-2xl md:text-5xl font-serif text-vitorra-gold mb-1 md:mb-2">{item.stat}</div>
                <div className="text-[10px] md:text-[11px] font-bold text-vitorra-muted uppercase tracking-widest">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Registration — Official Credentials */}
      <section className="py-12 md:py-20 bg-vitorra-bg border-t border-vitorra-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-vitorra-border bg-vitorra-card overflow-hidden"
          >
            {/* Gold accent top line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-vitorra-gold to-transparent" />

            <div className="px-5 md:px-14 py-8 md:py-14">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-12">
                
                {/* Uganda Coat of Arms / Official Seal */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-2 border-vitorra-gold/30 bg-vitorra-bg/50 flex items-center justify-center shadow-lg shadow-vitorra-gold/5">
                    <svg viewBox="0 0 64 64" className="w-9 h-9 md:w-16 md:h-16 text-vitorra-gold" fill="none" stroke="currentColor" strokeWidth="1.2">
                      {/* Shield shape */}
                      <path d="M32 6 L52 16 L52 34 C52 46 42 54 32 58 C22 54 12 46 12 34 L12 16 Z" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
                      {/* Inner divided shield */}
                      <path d="M32 16 L44 22 L44 34 C44 42 38 48 32 52 C26 48 20 42 20 34 L20 22 Z" strokeLinejoin="round" />
                      {/* Horizontal divisions */}
                      <line x1="20" y1="28" x2="44" y2="28" />
                      <line x1="20" y1="36" x2="44" y2="36" />
                      {/* Central vertical */}
                      <line x1="32" y1="16" x2="32" y2="52" />
                      {/* Crane bird silhouette (Uganda's national bird) - simplified */}
                      <circle cx="32" cy="24" r="2.5" fill="currentColor" fillOpacity="0.5" stroke="none" />
                      <path d="M29 32 L32 29 L35 32 L32 35 Z" fill="currentColor" fillOpacity="0.3" stroke="none" />
                    </svg>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-vitorra-gold mb-2 md:mb-3">
                    Republic of Uganda — Official Registration
                  </p>
                  <h3 className="text-lg md:text-2xl font-serif text-vitorra-text mb-4 md:mb-6">
                    Incorporated Under the Companies Act, 2012
                  </h3>

                  <div className="space-y-3 md:space-y-4">
                    {/* URSB Certificate */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-vitorra-muted sm:min-w-[180px]">
                        Certificate of Incorporation
                      </span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                        <span className="text-vitorra-text font-mono text-base sm:text-2xl md:text-3xl font-bold tracking-widest break-all">80034340923220</span>
                      </div>
                    </div>

                    {/* Issuing Authority */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-vitorra-muted sm:min-w-[180px]">
                        Issuing Authority
                      </span>
                      <span className="text-vitorra-text/80 text-xs md:text-sm">
                        Uganda Registration Services Bureau (URSB)
                      </span>
                    </div>

                    {/* Jurisdiction */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-vitorra-muted sm:min-w-[180px]">
                        Jurisdiction
                      </span>
                      <span className="text-vitorra-text/80 text-xs md:text-sm">
                        Kampala, Uganda — East African Community
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-vitorra-muted sm:min-w-[180px]">
                        Status
                      </span>
                      <span className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs md:text-sm font-semibold text-green-400">
                        <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-green-500"></span>
                        </span>
                        Active & Compliant
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gold accent bottom line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-vitorra-gold/30 to-transparent" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

