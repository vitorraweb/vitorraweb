import { motion } from 'motion/react';

export default function TermsOfService() {
  return (
    <div className="w-full pt-32 pb-24 bg-vitorra-bg min-h-screen text-vitorra-text/80 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif mb-6 text-vitorra-text">Terms of Service</h1>
          <div className="w-16 h-1 bg-vitorra-gold mb-8" />
          <p className="text-vitorra-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8 prose prose-invert max-w-none text-vitorra-muted"
        >
          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">1. Acknowledgment and Acceptance</h2>
            <p className="leading-relaxed">
              By accessing and using the Vitorra Holdings Limited website (the "Site"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">2. Intellectual Property Rights</h2>
            <p className="leading-relaxed">
              Unless otherwise stated, Vitorra Holdings Limited and/or its licensors own the intellectual property rights for all material on the Site. All intellectual property rights are reserved. You may access this from the Site for your own personal use subjected to restrictions set in these terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">3. Restrictions</h2>
            <p className="leading-relaxed">
              You are specifically restricted from:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Publishing any website material in any other media without credit.</li>
              <li>Selling, sublicensing, and/or otherwise commercializing any website material.</li>
              <li>Using this website in any way that is or may be damaging to this website.</li>
              <li>Using this website contrary to applicable laws and regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">4. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall Vitorra Holdings Limited, nor any of its officers, directors, metrics, and employees, be held liable for anything arising out of or in any way connected with your use of this website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">5. Governing Law & Jurisdiction</h2>
            <p className="leading-relaxed">
              These Terms will be governed by and interpreted in accordance with the laws of Uganda, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Uganda for the resolution of any disputes.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
