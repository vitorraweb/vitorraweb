import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <div className="w-full pt-32 pb-24 bg-vitorra-bg min-h-screen text-vitorra-text/80 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif mb-6 text-vitorra-text">Privacy Policy</h1>
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
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Vitorra Holdings Limited ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy informs you how we look after your personal data when you visit our website and tells you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">2. The Data We Collect</h2>
            <p className="leading-relaxed">
              We may collect, use, store and transfer different kinds of personal data about you when you interact with us via our contact forms or when entering a business partnership with our subsidiaries (such as Fuel Eco Tech or Vitorra Coffee). This may include:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Identity Data: First name, last name, job title, company.</li>
              <li>Contact Data: Email address, telephone numbers, business address.</li>
              <li>Technical Data: IP address, browser type and version, time zone setting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">3. How We Use Your Data</h2>
            <p className="leading-relaxed">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to respond to your inquiries, to manage our relationship with you, or to perform a contract we are about to enter into or have entered into with you. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">4. Data Security</h2>
            <p className="leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-vitorra-text mb-4">5. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this privacy policy or our privacy practices, please contact us at <strong>info@vitorraholdings.com</strong>.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
