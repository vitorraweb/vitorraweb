import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, FileText, Download } from 'lucide-react';

/* ─── Document categories with PDF links ─── */
const DOCUMENT_CATEGORIES = [
  {
    title: 'Certificates',
    items: [
      { name: 'ISO 9001', url: 'https://fuelecotech.com/assets/docs/en/cti-certificate-9001-2026-en.pdf' },
      { name: 'ISO 14001', url: 'https://fuelecotech.com/assets/docs/en/cti-certificate-14001-2026-en.pdf' },
      { name: 'ISO 21001', url: 'https://fuelecotech.com/assets/docs/en/cti-certificate-21001-2026-en.pdf' },
      { name: 'ISO 27001', url: 'https://fuelecotech.com/assets/docs/en/cti-certificate-27001-2026-en.pdf' },
    ],
  },
  {
    title: 'Installation & Setup',
    items: [
      { name: 'FET Installation Manual (A5)', url: 'https://fuelecotech.com/assets/docs/en/installation-manual-fet-a5-1.pdf' },
    ],
  },
  {
    title: 'Field Tests & Customer Feedback',
    items: [
      { name: 'Landesbauhof 2025 Test Report', url: 'https://fuelecotech.com/assets/docs/en/2025-11-25-cti-fet-testbericht-landesbauhof-2025-released-en.pdf' },
      { name: 'Porsche Cayenne Field Test Analysis', url: 'https://fuelecotech.com/assets/docs/en/cti-field-test-analysis-porsche-cayenne-en.pdf' },
      { name: 'Landesbauhof Stadthagen T5 Report', url: 'https://fuelecotech.com/assets/docs/en/2025-11-10-cti-fet-testbericht-landesbauhof-stadthagen-t5-2025-v3-de-en.pdf' },
      { name: 'Skoda Octavia Customer Feedback', url: 'https://fuelecotech.com/assets/docs/en/kundenfeedback-skoda-octavia-de-en.pdf' },
    ],
  },
  {
    title: 'Analyses & Comparisons',
    items: [
      { name: 'E-Truck vs Diesel Truck Analysis', url: 'https://fuelecotech.com/assets/docs/en/2025-07-07-analysis-linkedin-report-e-truck-vs-diesel-de-en.pdf' },
    ],
  },
  {
    title: 'Flyers & Product Info',
    items: [
      { name: 'FET Product Flyer 2026', url: 'https://fuelecotech.com/assets/docs/de/fet-flyer-2026.pdf' },
    ],
  },
];

/* ─── Key figures from the lab test ─── */
const KEY_FIGURES = [
  { stat: 'up to 6%', label: 'Average Consumption Reduction' },
  { stat: 'up to 8.8%', label: 'Peak Consumption Reduction' },
  { stat: '7–20%', label: 'Emission Reduction' },
  { stat: 'up to 15%', label: 'Constant-Speed Savings' },
];

export default function FETLabTest() {
  const [openCategory, setOpenCategory] = useState<number | null>(0);

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text transition-colors duration-500">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://fuelecotech.com/assets/img/news/labortest.jpg"
            alt="FET System laboratory test"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vitorra-bg via-vitorra-bg/70 to-vitorra-bg/30" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pb-16 pt-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link to="/products/fet" className="inline-flex items-center gap-2 text-vitorra-muted hover:text-emerald-400 transition-colors text-sm mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to FET
            </Link>

            <div className="flex flex-wrap gap-2 mb-6">
              {['FET', 'Lab Test', 'WLTC', 'Certification'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 uppercase tracking-widest font-bold">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-serif leading-[1.15] mb-6 text-vitorra-text">
              FET System Impresses in Laboratory Test
            </h1>

            <p className="text-vitorra-muted text-sm">Bückeburg, July 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Key Figures */}
      <section className="py-16 bg-vitorra-bg-alt border-b border-vitorra-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {KEY_FIGURES.map((item, idx) => (
              <div key={idx}>
                <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-2">{item.stat}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-vitorra-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-serif text-vitorra-text mb-4">Significant savings during constant-speed runs confirm effectiveness</h2>
              <p className="text-vitorra-text/80 text-lg leading-relaxed">
                The innovative fuel optimisation system Fuel Eco Tech (FET) was subjected to a comprehensive WLTC and constant-speed test under standardised laboratory conditions. The results show: especially in the area of constant-speed runs, the system impressed with clear reductions in fuel consumption and emissions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-vitorra-text mb-4">Fuel Eco Tech: efficiency through targeted fuel structuring</h2>
              <p className="text-vitorra-text/80 text-lg leading-relaxed">
                Fuel Eco Tech is integrated into the fuel line after the fuel filter and before the high-pressure pump or injection system. It acts physically on the fuel &ndash; through targeted structuring, homogenisation and potential molecular effects. The goal is optimised combustion, lower emissions, and reduced fuel consumption.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-vitorra-text mb-4">Laboratory tested: focus on WLTC cycle and constant-speed runs</h2>
              <p className="text-vitorra-text/80 text-lg leading-relaxed">
                In the test, the system was installed in a diesel vehicle with modern injection technology. Five WLTC cycles and subsequent constant-speed runs at 50, 80 and 130 km/h were performed both with and without FET. Installation was carried out using quick couplings in the defined supply area.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-vitorra-text mb-4">Constant-speed runs as the highlight</h2>
              <ul className="space-y-3 text-vitorra-text/80 text-lg leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
                  At constant speed, average consumption values were measurably and consistently reduced.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
                  Fuel efficiency (km/l) increased significantly &ndash; with partly double-digit improvement values in peak data.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
                  Emissions also decreased continuously under constant load conditions.
                </li>
              </ul>
              <p className="text-vitorra-text/80 text-lg leading-relaxed mt-4">
                These results are particularly relevant in practice, since constant-speed runs reflect typical conditions for motorway, regional and fleet driving.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-vitorra-text mb-4">Conclusion: passed</h2>
              <p className="text-vitorra-text/80 text-lg leading-relaxed">
                Fuel Eco Tech reduces fuel consumption and lowers emissions &ndash; especially during constant-speed runs. This makes the system ideal for vehicles with high mileage, such as field service vehicles, fleet operations, or commuters.
              </p>
            </div>
          </motion.article>
        </div>
      </section>

      {/* Documents & Reports */}
      <section className="py-24 bg-vitorra-bg-alt border-t border-vitorra-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-emerald-400 text-[11px] font-bold tracking-[0.25em] uppercase block mb-4">Downloads</span>
            <h2 className="text-2xl md:text-3xl font-serif text-vitorra-text">Documents &amp; Reports</h2>
          </div>

          <div className="space-y-4">
            {DOCUMENT_CATEGORIES.map((category, catIdx) => (
              <div key={catIdx} className="rounded-2xl bg-vitorra-card border border-vitorra-border overflow-hidden">
                <button
                  onClick={() => setOpenCategory(openCategory === catIdx ? null : catIdx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-vitorra-text font-bold">{category.title}</span>
                    <span className="text-[11px] text-vitorra-muted bg-vitorra-bg px-2 py-0.5 rounded-full">{category.items.length}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-vitorra-muted shrink-0 transition-transform duration-300 ${openCategory === catIdx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openCategory === catIdx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 space-y-2">
                        {category.items.map((doc, docIdx) => (
                          <a
                            key={docIdx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-vitorra-bg border border-vitorra-border hover:border-emerald-500/30 transition-colors group/doc"
                          >
                            <span className="text-sm text-vitorra-text group-hover/doc:text-emerald-400 transition-colors">{doc.name}</span>
                            <Download className="w-4 h-4 text-vitorra-muted group-hover/doc:text-emerald-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-vitorra-bg border-t border-vitorra-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            to="/products/fet"
            className="inline-flex items-center gap-3 px-10 py-4 bg-emerald-500 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            Back to FET Product Page
          </Link>
        </div>
      </section>
    </div>
  );
}
