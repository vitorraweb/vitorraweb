import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Contact() {
  const { state } = useCMS();
  const { pageContent, companyInfo } = state;

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      if (!db) throw new Error('Database unavailable');
      await addDoc(collection(db, 'contactSubmissions'), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        subject: form.subject || 'General Inquiry',
        message: form.message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
        source: 'website_contact_form',
        userAgent: navigator.userAgent,
      });
      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact form submission failed:', err);
      setStatus('error');
      setErrorMsg('Something went wrong. Please try emailing us directly.');
    }
  };

  const inputClass = "w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors";

  return (
    <div className="w-full pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20"
        >
          <h1 className="text-3xl md:text-5xl font-serif mb-4 md:mb-6">{pageContent.contactTitle}</h1>
          <div className="w-16 h-1 bg-vitorra-gold mx-auto mb-6 md:mb-8" />
          <p className="text-base md:text-xl text-vitorra-muted max-w-2xl mx-auto leading-relaxed">
            {pageContent.contactDescription}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {/* Contact Information — now CMS-driven */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-10"
          >
            <h2 className="text-2xl md:text-3xl font-serif mb-6 md:mb-8">Corporate Headquarters</h2>
            
            {[
              { icon: <Phone className="w-5 h-5" />, label: "Direct Line", value: companyInfo.phone, sub: "Available 24/7 for urgent care" },
              { icon: <Mail className="w-5 h-5" />, label: "Email Support", value: companyInfo.email, sub: "General & B2B inquiries" },
              { icon: <MapPin className="w-5 h-5" />, label: "Headquarters", value: companyInfo.address[0], sub: companyInfo.address.slice(1).join(", ") }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-vitorra-card border border-vitorra-border rounded-2xl hover:border-vitorra-gold/30 transition-all group">
                <div className="w-10 h-10 bg-vitorra-gold/10 rounded-xl flex items-center justify-center text-vitorra-gold group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-vitorra-muted mb-1">{item.label}</p>
                  <p className="text-vitorra-text font-serif text-lg leading-tight mb-1">{item.value}</p>
                  <p className="text-vitorra-muted text-xs leading-relaxed">{item.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-vitorra-card/95 backdrop-blur-md p-6 md:p-10 border border-vitorra-border rounded-3xl shadow-2xl transition-all duration-500"
          >
            {status === 'success' ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-vitorra-text mb-2">Message Sent</h3>
                <p className="text-sm text-vitorra-muted mb-8">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <button 
                  onClick={() => setStatus('idle')} 
                  className="px-6 py-3 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-serif mb-6 md:mb-8">{pageContent.contactFormTitle}</h2>

                {status === 'error' && errorMsg && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-vitorra-muted">First Name *</label>
                      <input 
                        type="text" id="firstName" required
                        value={form.firstName}
                        onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-vitorra-muted">Last Name</label>
                      <input 
                        type="text" id="lastName"
                        value={form.lastName}
                        onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-vitorra-muted">Email Address *</label>
                    <input 
                      type="email" id="email" required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-vitorra-muted">Subject</label>
                    <div className="relative">
                      <select 
                        id="subject"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="" className="bg-vitorra-card text-vitorra-text">Select a topic</option>
                        <option value="investment" className="bg-vitorra-card text-vitorra-text">Investment Opportunities</option>
                        <option value="fet" className="bg-vitorra-card text-vitorra-text">Fuel Eco Tech (FET) Inquiry</option>
                        <option value="seal" className="bg-vitorra-card text-vitorra-text">SEAL Wound Care Inquiry</option>
                        <option value="coffee" className="bg-vitorra-card text-vitorra-text">Vitorra Coffee Partnership</option>
                        <option value="logistics" className="bg-vitorra-card text-vitorra-text">Logistics Partnership</option>
                        <option value="other" className="bg-vitorra-card text-vitorra-text">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-vitorra-muted">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-vitorra-muted">Message *</label>
                    <textarea 
                      id="message" rows={5} required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className={`${inputClass} resize-none`}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={status === 'sending'}
                    className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-colors mt-4 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'sending' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
