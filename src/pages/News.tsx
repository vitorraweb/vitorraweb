import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function News() {
  const { state } = useCMS();
  const published = state.blogs.filter(b => b.status === 'published');

  const featured = published[0];
  const rest = published.slice(1);

  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!subEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) {
      setSubStatus('error');
      return;
    }
    setSubStatus('sending');
    try {
      if (!db) throw new Error('DB unavailable');
      await addDoc(collection(db, 'subscribers'), {
        email: subEmail.trim().toLowerCase(),
        source: 'news_page',
        subscribedAt: serverTimestamp(),
      });
      setSubStatus('success');
      setSubEmail('');
    } catch {
      setSubStatus('error');
    }
  };

  return (
    <div className="w-full bg-vitorra-bg min-h-screen text-vitorra-text/70 pb-16 font-sans transition-colors duration-500">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-screen flex items-center overflow-hidden bg-vitorra-bg pt-32 md:pt-24">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-y-0 right-0 w-full md:w-[50%] overflow-hidden">
            <img src="/images/news_hero.png" alt="Vitorra Insights" className="w-full h-full object-cover opacity-30 md:opacity-100 transition-all duration-700" />
          </div>
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-vitorra-bg via-vitorra-bg via-[80%] to-transparent z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vitorra-gold/10 backdrop-blur-md border border-vitorra-gold/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-vitorra-gold animate-pulse" />
              <span className="text-vitorra-gold text-[11px] font-black tracking-[0.2em] uppercase">Vitorra Insights</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif mb-4 md:mb-6 text-vitorra-text">
              Quarterly Market <br />
              <span className="text-vitorra-gold">Intelligence.</span>
            </h1>
            <p className="text-sm md:text-base text-vitorra-text/70 mb-10 max-w-xl leading-relaxed font-normal">
              Stay informed about our latest investments, partnerships, and corporate developments from across the Vitorra ecosystem.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {published.length === 0 ? (
            <div className="text-center py-24 px-8 border border-dashed border-vitorra-border rounded-3xl">
              <div className="w-20 h-20 mx-auto bg-vitorra-gold/10 rounded-2xl flex items-center justify-center mb-8 border border-vitorra-gold/20">
                <CalendarDays className="w-10 h-10 text-vitorra-gold" />
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-vitorra-text mb-4">Coming Soon</h3>
              <p className="text-vitorra-muted max-w-md mx-auto mb-8 leading-relaxed">
                Our insights team is preparing the latest market intelligence and corporate updates. Subscribe to be notified when new articles are published.
              </p>
              <div className="max-w-sm mx-auto">
                {subStatus === 'success' ? (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-bold">You're subscribed!</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input 
                      type="email" 
                      placeholder="your@email.com" 
                      value={subEmail}
                      onChange={e => { setSubEmail(e.target.value); if (subStatus === 'error') setSubStatus('idle'); }}
                      onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                      className={`flex-1 bg-vitorra-bg/50 border rounded-xl px-4 py-3 text-vitorra-text placeholder-vitorra-muted/40 outline-none focus:border-vitorra-gold/50 transition-all text-sm ${subStatus === 'error' ? 'border-red-500/50' : 'border-vitorra-border'}`}
                    />
                    <button 
                      onClick={handleSubscribe}
                      disabled={subStatus === 'sending'}
                      className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-vitorra-gold/20 disabled:opacity-50"
                    >
                      {subStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Featured Article */}
              {featured && (
                <Link to={`/news/${featured.id}`} className="group block">
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-vitorra-card rounded-[2rem] overflow-hidden border border-vitorra-border hover:border-vitorra-gold/30 transition-all duration-500"
                  >
                    <div className="relative h-72 lg:h-auto overflow-hidden bg-vitorra-bg-alt">
                      <img src={featured.imageUrl} alt={featured.title}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <span className="px-3 py-1 bg-vitorra-gold/10 border border-vitorra-gold/20 rounded-full text-vitorra-gold text-[11px] font-bold uppercase tracking-widest w-fit mb-6">Featured</span>
                      <div className="flex items-center gap-4 text-xs text-vitorra-muted/60 mb-4">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {featured.date}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {featured.author}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif text-vitorra-text mb-4 group-hover:text-vitorra-gold transition-colors leading-snug">
                        {featured.title}
                      </h2>
                      <p className="text-vitorra-muted leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                      {featured.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {featured.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 bg-vitorra-bg/5 border border-vitorra-border rounded text-[11px] text-vitorra-muted uppercase">{t}</span>
                          ))}
                        </div>
                      )}
                      <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-vitorra-gold group-hover:gap-3 transition-all">
                        Read Full Article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </motion.article>
                </Link>
              )}

              {/* Other Articles Grid */}
              {rest.length > 0 && (
                <div className={`grid gap-8 ${rest.length === 1 ? 'grid-cols-1' : rest.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {rest.map((blog, idx) => (
                    <Link to={`/news/${blog.id}`} key={blog.id} className="group">
                      <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`flex bg-vitorra-card overflow-hidden border border-vitorra-border hover:border-vitorra-gold/30 shadow-sm hover:shadow-xl transition-all duration-500 h-full ${rest.length === 1 ? 'flex-col md:flex-row rounded-[2rem]' : 'flex-col rounded-[2rem]'}`}
                      >
                        <div className={`relative overflow-hidden bg-vitorra-bg-alt ${rest.length === 1 ? 'h-64 md:h-auto md:w-[45%]' : 'h-64'}`}>
                          {blog.imageUrl ? (
                            <img src={blog.imageUrl} alt={blog.title}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-vitorra-muted text-4xl font-serif">V</div>
                          )}
                        </div>
                        <div className={`flex flex-col flex-grow ${rest.length === 1 ? 'px-8 py-8 md:px-10 md:py-10 justify-center' : 'px-8 py-6'}`}>
                          <div className="flex items-center gap-4 text-xs text-vitorra-muted/60 mb-4">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {blog.date}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {blog.author}</span>
                          </div>
                          <h2 className={`font-serif text-vitorra-text mb-3 group-hover:text-vitorra-gold transition-colors line-clamp-2 ${rest.length === 1 ? 'text-2xl md:text-3xl' : 'text-xl'}`}>{blog.title}</h2>
                          <p className="text-vitorra-muted text-sm leading-relaxed mb-6 flex-grow line-clamp-3">{blog.excerpt}</p>
                          {blog.tags && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {blog.tags.slice(0, 3).map(t => (
                                <span key={t} className="px-2 py-0.5 bg-vitorra-bg/5 border border-vitorra-border rounded text-[11px] text-vitorra-muted uppercase">{t}</span>
                              ))}
                            </div>
                          )}
                          <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-vitorra-text/50 group-hover:text-vitorra-gold transition-colors">
                            Read More <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </motion.article>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
