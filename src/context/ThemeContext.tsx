import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type AestheticMode = 'default' | 'midnight' | 'charcoal' | 'emerald' | 'steel' | 'purple';

export interface AestheticThemeColors {
  primary: string;
  secondary: string;
  gold: string;
  goldHover: string;
}

export const AESTHETIC_THEMES: Record<Exclude<AestheticMode, 'default'>, AestheticThemeColors> = {
  midnight: {
    primary: '#0A1628',
    secondary: '#111D2E',
    gold: '#D4A843',
    goldHover: '#C49A3D'
  },
  charcoal: {
    primary: '#1A1A1A',
    secondary: '#333333',
    gold: '#D4AF37',
    goldHover: '#C29F32'
  },
  emerald: {
    primary: '#0F3D2E',
    secondary: '#1E6F5C',
    gold: '#C9A24A',
    goldHover: '#B69242'
  },
  steel: {
    primary: '#2C3E50',
    secondary: '#95A5A6',
    gold: '#C9A24A',
    goldHover: '#B69242'
  },
  purple: {
    primary: '#2E1A47',
    secondary: '#4B2C6F',
    gold: '#D4AF37',
    goldHover: '#C29F32'
  }
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  aestheticMode: AestheticMode;
  setAestheticMode: (mode: AestheticMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('vitorra-theme') as Theme;
    if (saved) return saved;
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  });

  const [aestheticMode, setAestheticModeState] = useState<AestheticMode>(() => {
    return (localStorage.getItem('vitorra-aesthetic') as AestheticMode) || 'midnight';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('vitorra-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const setAestheticMode = (mode: AestheticMode) => {
    setAestheticModeState(mode);
    localStorage.setItem('vitorra-aesthetic', mode);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clear any previous aesthetic styles
    if (aestheticMode === 'default') {
      root.style.removeProperty('--bg-primary');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--vitorra-gold');
      root.style.removeProperty('--vitorra-gold-hover');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
      root.style.removeProperty('--card-bg');
      root.style.removeProperty('--border-color');
      root.style.removeProperty('--nav-bg');

      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      // Apply aesthetic theme
      const colors = AESTHETIC_THEMES[aestheticMode];
      root.classList.add('dark'); // All aesthetic themes are dark-based
      
      root.style.setProperty('--bg-primary', colors.primary);
      root.style.setProperty('--bg-secondary', colors.secondary);
      root.style.setProperty('--vitorra-gold', colors.gold);
      root.style.setProperty('--vitorra-gold-hover', colors.goldHover);
      root.style.setProperty('--text-primary', '#F0F2F5');
      root.style.setProperty('--text-secondary', '#7A8BA0');
      root.style.setProperty('--card-bg', aestheticMode === 'midnight' ? '#142237' : colors.secondary);
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--nav-bg', 'rgba(0, 0, 0, 0.5)');
      // New semantic tokens
      root.style.setProperty('--surface-elevated', aestheticMode === 'midnight' ? '#1A2D45' : colors.secondary);
      root.style.setProperty('--text-tertiary', '#556578');
      root.style.setProperty('--surface-interactive', 'rgba(212, 168, 67, 0.06)');
    }
  }, [theme, aestheticMode]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, aestheticMode, setAestheticMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
