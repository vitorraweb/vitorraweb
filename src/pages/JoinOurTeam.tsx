import { motion } from 'motion/react';
import { ArrowRight, UserPlus, Clock, MapPin, Briefcase, ChevronRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';

export default function JoinOurTeam() {
  const { state } = useCMS();
  const openJobs = state.jobs.filter(j => j.status === 'open');

  const typeLabels: Record<string, string> = {
    'full-time': 'Full-Time', 'part-time': 'Part-Time', 'contract': 'Contract', 'internship': 'Internship'
  };
  const typeColors: Record<string, string> = {
    'full-time': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'contract': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'internship': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text pb-16 transition-colors duration-500 font-sans">
      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-vitorra-bg pt-32 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[60%] overflow-hidden">
            <img
              src="/images/interview_setting.png"
              alt="Join Vitorra Holdings Team"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[70%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[70%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-vitorra-gold/10 border border-vitorra-gold/20 text-[10px] font-bold text-vitorra-gold uppercase tracking-[0.2em] flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> {openJobs.length > 0 ? `${openJobs.length} Open Position${openJobs.length > 1 ? 's' : ''}` : 'Careers'}
              </span>
            </div>
            <h1 className="mb-8 text-4xl md:text-5xl lg:text-6xl leading-tight">
              Build the Future <br />
              <span className="text-vitorra-gold">With Us</span>
            </h1>
            <div className="space-y-4 text-vitorra-text/70 mb-10 max-w-xl leading-relaxed font-normal">
              <p>
                At Vitorra Holdings, we don't just offer jobs — we offer opportunities to grow, lead, and create impact across industries.
              </p>
              <p>
                We are a diversified international group operating across pharmaceutical, automotive, logistics, and trade sectors.
              </p>
              <p>
                Our strength lies in our people — individuals who are driven, reliable, and committed to excellence.
              </p>
            </div>
            {openJobs.length > 0 ? (
              <a href="#positions" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 inline-flex items-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-vitorra-gold/20">
                View Open Positions <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link to="/contact" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-text hover:text-vitorra-bg transition-all duration-300 inline-flex items-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-vitorra-gold/20">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — OPEN POSITIONS
          ═══════════════════════════════════════════ */}
      <section id="positions" className="py-24 bg-vitorra-bg border-t border-vitorra-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {openJobs.length > 0 ? (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl text-vitorra-text mb-4">Open Positions</h2>
                <p className="text-vitorra-muted leading-relaxed max-w-2xl mx-auto">
                  Explore current openings across our portfolio companies. We're looking for driven professionals who share our commitment to excellence.
                </p>
              </motion.div>

              <div className="space-y-4">
                {openJobs.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-vitorra-card border border-vitorra-border rounded-2xl overflow-hidden hover:border-vitorra-gold/20 transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-vitorra-text group-hover:text-vitorra-gold transition-colors mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-vitorra-muted">
                            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{job.department}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{job.postedDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeColors[job.type] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                            {typeLabels[job.type] || job.type}
                          </span>
                          {job.salary && (
                            <span className="px-3 py-1.5 rounded-full bg-vitorra-gold/5 text-vitorra-gold border border-vitorra-gold/20 text-[10px] font-bold">
                              {job.salary}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-vitorra-muted text-sm leading-relaxed mb-6">{job.description}</p>

                      {/* Requirements & Responsibilities */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {job.requirements.length > 0 && (
                          <div>
                            <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-3">Requirements</h4>
                            <ul className="space-y-2">
                              {job.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-vitorra-text/80">
                                  <ChevronRight className="w-3.5 h-3.5 text-vitorra-gold mt-0.5 shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {job.responsibilities.length > 0 && (
                          <div>
                            <h4 className="text-[10px] text-vitorra-muted uppercase font-bold tracking-widest mb-3">Responsibilities</h4>
                            <ul className="space-y-2">
                              {job.responsibilities.map((resp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-vitorra-text/80">
                                  <ChevronRight className="w-3.5 h-3.5 text-vitorra-gold mt-0.5 shrink-0" />
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Apply CTA */}
                      <div className="mt-6 pt-6 border-t border-vitorra-border/50">
                        <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-vitorra-gold/20">
                          Apply Now <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-vitorra-gold/10 flex items-center justify-center mx-auto mb-8">
                <UserPlus className="w-10 h-10 text-vitorra-gold" />
              </div>
              <h2 className="text-3xl md:text-4xl text-vitorra-text mb-6">No Open Positions Right Now</h2>
              <p className="text-vitorra-muted leading-relaxed text-lg max-w-2xl mx-auto mb-8">
                We're always looking for talented people. Check back soon or send us a message via the Contact page if you'd like to get in touch early.
              </p>
              <Link to="/contact" className="px-8 py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-vitorra-gold/20">
                Get in Touch <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
