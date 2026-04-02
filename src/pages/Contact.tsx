import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

export default function Contact() {
  const { state } = useCMS();
  const { pageContent, companyInfo } = state;

  return (
    <div className="w-full pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-3xl md:text-5xl font-serif mb-6">{pageContent.contactTitle}</h1>
          <div className="w-16 h-1 bg-vitorra-gold mx-auto mb-8" />
          <p className="text-xl text-vitorra-muted max-w-2xl mx-auto leading-relaxed">
            {pageContent.contactDescription}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information — now CMS-driven */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-10"
          >
            <h2 className="text-3xl font-serif mb-8">Corporate Headquarters</h2>
            
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
                  <p className="text-[10px] uppercase tracking-widest text-vitorra-muted mb-1">{item.label}</p>
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
            className="bg-vitorra-card/95 backdrop-blur-md p-10 border border-vitorra-border rounded-3xl shadow-2xl transition-all duration-500"
          >
            <h2 className="text-3xl font-serif mb-8">{pageContent.contactFormTitle}</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-vitorra-muted">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    className="w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-vitorra-muted">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    className="w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-vitorra-muted">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-vitorra-muted">Subject</label>
                <div className="relative">
                  <select 
                    id="subject" 
                    className="w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors appearance-none cursor-pointer"
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
                <label htmlFor="message" className="text-sm font-medium text-vitorra-muted">Message</label>
                <textarea 
                  id="message" 
                  rows={5}
                  className="w-full bg-vitorra-bg/40 backdrop-blur-sm border border-vitorra-border rounded-xl px-4 py-3 text-vitorra-text focus:outline-none focus:border-vitorra-gold transition-colors resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-vitorra-gold text-vitorra-gold-text font-bold rounded-xl hover:bg-vitorra-gold-hover transition-colors mt-4 shadow-lg"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
