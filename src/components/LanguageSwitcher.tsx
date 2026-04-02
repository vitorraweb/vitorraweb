import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'sw', label: 'Kiswahili' },
] as const;

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative group flex items-center" 
         onMouseEnter={() => setIsOpen(true)} 
         onMouseLeave={() => setIsOpen(false)}>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-vitorra-text/80 hover:text-vitorra-gold transition-colors py-2 px-1 rounded-lg">
        <Globe className="w-5 h-5 sm:w-5 sm:h-5" />
        <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">
          {language}
        </span>
        <ChevronDown className="w-3 h-3 hidden sm:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%)] right-0 w-36 bg-vitorra-bg/95 backdrop-blur-xl border border-vitorra-border shadow-2xl rounded-2xl overflow-hidden z-50 py-2"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                  language === lang.code 
                    ? 'text-vitorra-gold bg-vitorra-gold/5 font-bold' 
                    : 'text-vitorra-text/80 hover:bg-vitorra-gold/10 hover:text-vitorra-text'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
