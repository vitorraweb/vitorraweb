import React, { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, AestheticMode, AESTHETIC_THEMES } from '../context/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { aestheticMode, setAestheticMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: AestheticMode; name: string; description: string }[] = [
    { id: 'default', name: 'Default', description: 'Original Light/Dark Mode' },
    { id: 'midnight', name: 'Midnight Blue', description: 'Corporate & Trusted' },
    { id: 'charcoal', name: 'Charcoal Black', description: 'Distinctive & Powerful' },
    { id: 'emerald', name: 'Deep Emerald', description: 'Healthcare & Growth' },
    { id: 'steel', name: 'Steel Blue', description: 'Industrial & Logistics' },
    { id: 'purple', name: 'Royal Purple', description: 'Executive & Strategic' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-vitorra-gold text-vitorra-gold-text rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-white/20 backdrop-blur-md"
          aria-label="Theme Switcher"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Palette className="w-6 h-6" />}
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              className="absolute bottom-16 right-0 w-72 bg-vitorra-bg-alt/95 backdrop-blur-2xl border border-vitorra-border rounded-3xl shadow-2xl overflow-hidden p-2"
            >
              <div className="p-4 border-b border-vitorra-border">
                <h3 className="text-sm font-bold uppercase tracking-widest text-vitorra-text/60">Aesthetic Themes</h3>
                <p className="text-[10px] text-vitorra-muted mt-1 uppercase tracking-tighter">Demonstration Only</p>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {themes.map((t) => {
                  const colors = t.id === 'default' ? null : AESTHETIC_THEMES[t.id];
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setAestheticMode(t.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5 group ${
                        aestheticMode === t.id ? 'bg-vitorra-gold/10' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-vitorra-border flex flex-col">
                         {t.id === 'default' ? (
                           <div className="flex-1 bg-gradient-to-br from-white to-gray-800" />
                         ) : (
                           <>
                             <div className="flex-1" style={{ backgroundColor: colors?.primary }} />
                             <div className="h-3" style={{ backgroundColor: colors?.gold }} />
                           </>
                         )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold truncate ${aestheticMode === t.id ? 'text-vitorra-gold' : 'text-vitorra-text'}`}>
                            {t.name}
                          </span>
                          {aestheticMode === t.id && <Check className="w-4 h-4 text-vitorra-gold" />}
                        </div>
                        <p className="text-[10px] text-vitorra-muted truncate">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
