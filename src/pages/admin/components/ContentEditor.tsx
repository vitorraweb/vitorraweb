import { useState } from 'react';
import { useCMS } from '../../../context/CMSContext';
import { ChevronDown, ChevronRight, Save } from 'lucide-react';

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 bg-black/40 hover:bg-black/60 transition-colors text-left">
        <h4 className="text-lg font-medium text-vitorra-gold">{title}</h4>
        {open ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>
      {open && <div className="p-6 space-y-4 border-t border-white/5">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vitorra-gold/50 outline-none transition-all h-28 resize-y text-sm" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-vitorra-gold/50 outline-none transition-all text-sm" />
      )}
    </div>
  );
}

export default function ContentEditor() {
  const { state, updatePageContent, updateCompanyInfo, updateSocialLinks, updateStats, updateCoreValues, updateInvestmentPillars } = useCMS();
  const pc = state.pageContent;
  const ci = state.companyInfo;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h3 className="text-3xl font-serif text-white mb-2">Global Content Management</h3>
        <p className="text-gray-400">Edit every piece of text across every page of the website. Changes are applied in real-time.</p>
      </div>

      {/* ── HOME PAGE ────────────────────────────────────── */}
      <Section title="🏠 Home Page — Hero" defaultOpen={true}>
        <Field label="Primary Title" value={pc.homeHeroTitle} onChange={v => updatePageContent('homeHeroTitle', v)} />
        <Field label="Subtitle (Gold Italic)" value={pc.homeHeroSubtitle} onChange={v => updatePageContent('homeHeroSubtitle', v)} />
        <Field label="Description" value={pc.homeHeroDescription} onChange={v => updatePageContent('homeHeroDescription', v)} multiline />
      </Section>

      <Section title="🏠 Home Page — Ecosystem Section">
        <Field label="Section Title" value={pc.ecosystemTitle} onChange={v => updatePageContent('ecosystemTitle', v)} />
        <Field label="Section Description" value={pc.ecosystemDescription} onChange={v => updatePageContent('ecosystemDescription', v)} multiline />
      </Section>

      <Section title="🌍 Home Page — Global Impact & Stats">
        <Field label="Section Title" value={pc.globalImpactTitle} onChange={v => updatePageContent('globalImpactTitle', v)} />
        <Field label="Section Description" value={pc.globalImpactDescription} onChange={v => updatePageContent('globalImpactDescription', v)} multiline />
        <div className="pt-4 border-t border-white/10">
          <label className="block text-sm text-gray-400 mb-3">Stats (displayed as the 4 metric cards)</label>
          <div className="grid grid-cols-2 gap-3">
            {state.stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                <input value={s.stat} onChange={e => { const ns = [...state.stats]; ns[i] = { ...ns[i], stat: e.target.value }; updateStats(ns); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-bold outline-none focus:border-vitorra-gold/50" placeholder="4+" />
                <input value={s.label} onChange={e => { const ns = [...state.stats]; ns[i] = { ...ns[i], label: e.target.value }; updateStats(ns); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-gray-300 text-xs outline-none focus:border-vitorra-gold/50" placeholder="Label" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ABOUT PAGE ───────────────────────────────────── */}
      <Section title="ℹ️ About Page — Hero">
        <Field label="Hero Title" value={pc.aboutHeroTitle} onChange={v => updatePageContent('aboutHeroTitle', v)} />
        <Field label="Hero Subtitle (Gold Italic)" value={pc.aboutHeroSubtitle} onChange={v => updatePageContent('aboutHeroSubtitle', v)} />
        <Field label="Hero Description" value={pc.aboutHeroDescription} onChange={v => updatePageContent('aboutHeroDescription', v)} multiline />
      </Section>

      <Section title="ℹ️ About Page — Vision & Mission">
        <Field label="Vision Title" value={pc.visionTitle} onChange={v => updatePageContent('visionTitle', v)} />
        <Field label="Vision Description" value={pc.visionDescription} onChange={v => updatePageContent('visionDescription', v)} multiline />
        <Field label="Mission Title" value={pc.missionTitle} onChange={v => updatePageContent('missionTitle', v)} />
        <Field label="Mission Description" value={pc.missionDescription} onChange={v => updatePageContent('missionDescription', v)} multiline />
      </Section>

      <Section title="ℹ️ About Page — Core Values">
        {state.coreValues.map((v, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <input value={v.title} onChange={e => { const nv = [...state.coreValues]; nv[i] = { ...nv[i], title: e.target.value }; updateCoreValues(nv); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold outline-none focus:border-vitorra-gold/50" />
            <textarea value={v.description} onChange={e => { const nv = [...state.coreValues]; nv[i] = { ...nv[i], description: e.target.value }; updateCoreValues(nv); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm outline-none focus:border-vitorra-gold/50 h-20 resize-y" />
          </div>
        ))}
      </Section>

      <Section title="ℹ️ About Page — Leadership">
        <Field label="Leadership Section Title" value={pc.leadershipTitle} onChange={v => updatePageContent('leadershipTitle', v)} />
        <Field label="Leadership Description" value={pc.leadershipDescription} onChange={v => updatePageContent('leadershipDescription', v)} multiline />
        <Field label="Leadership Quote" value={pc.leadershipQuote} onChange={v => updatePageContent('leadershipQuote', v)} />
      </Section>

      {/* ── PORTFOLIO PAGE ───────────────────────────────── */}
      <Section title="💼 Portfolio Page — Investment Philosophy">
        <Field label="Section Title" value={pc.investmentPhilosophyTitle} onChange={v => updatePageContent('investmentPhilosophyTitle', v)} />
        <Field label="Section Description" value={pc.investmentPhilosophyDescription} onChange={v => updatePageContent('investmentPhilosophyDescription', v)} multiline />
        {state.investmentPillars.map((p, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <input value={p.title} onChange={e => { const np = [...state.investmentPillars]; np[i] = { ...np[i], title: e.target.value }; updateInvestmentPillars(np); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold outline-none focus:border-vitorra-gold/50" />
            <textarea value={p.description} onChange={e => { const np = [...state.investmentPillars]; np[i] = { ...np[i], description: e.target.value }; updateInvestmentPillars(np); }} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm outline-none focus:border-vitorra-gold/50 h-20 resize-y" />
          </div>
        ))}
      </Section>

      {/* ── CONTACT PAGE ─────────────────────────────────── */}
      <Section title="📞 Contact Page">
        <Field label="Page Title" value={pc.contactTitle} onChange={v => updatePageContent('contactTitle', v)} />
        <Field label="Page Description" value={pc.contactDescription} onChange={v => updatePageContent('contactDescription', v)} multiline />
        <Field label="Form Title" value={pc.contactFormTitle} onChange={v => updatePageContent('contactFormTitle', v)} />
      </Section>

      {/* ── COMPANY INFO & FOOTER ────────────────────────── */}
      <Section title="🏢 Company Information & Footer">
        <Field label="Footer Description" value={pc.footerDescription} onChange={v => updatePageContent('footerDescription', v)} multiline />
        <Field label="Company Email" value={ci.email} onChange={v => updateCompanyInfo({ email: v })} />
        <Field label="Sales Email" value={ci.salesEmail} onChange={v => updateCompanyInfo({ salesEmail: v })} />
        <Field label="Phone" value={ci.phone} onChange={v => updateCompanyInfo({ phone: v })} />
        <Field label="Business Hours" value={ci.businessHours} onChange={v => updateCompanyInfo({ businessHours: v })} />
        <div className="pt-4 border-t border-white/10">
          <label className="block text-sm text-gray-400 mb-3">Office Address (one line per field)</label>
          {ci.address.map((line, i) => (
            <input key={i} value={line} onChange={e => { const na = [...ci.address]; na[i] = e.target.value; updateCompanyInfo({ address: na }); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 outline-none focus:border-vitorra-gold/50" />
          ))}
        </div>
        <div className="pt-4 border-t border-white/10">
          <label className="block text-sm text-gray-400 mb-3">Social Media URLs</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="LinkedIn" value={ci.socialLinks.linkedin} onChange={v => updateSocialLinks({ linkedin: v })} />
            <Field label="Twitter / X" value={ci.socialLinks.twitter} onChange={v => updateSocialLinks({ twitter: v })} />
            <Field label="Facebook" value={ci.socialLinks.facebook} onChange={v => updateSocialLinks({ facebook: v })} />
            <Field label="Instagram" value={ci.socialLinks.instagram} onChange={v => updateSocialLinks({ instagram: v })} />
          </div>
        </div>
      </Section>
    </div>
  );
}
