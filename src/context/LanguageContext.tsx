import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr' | 'ar' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    about: 'About',
    products: 'Products',
    news: 'News',
    contact: 'Contact',
    join_our_team: 'Join Our Team',
    privacy_policy: 'Privacy Policy',
    terms: 'Terms of Service',
    all_rights_reserved: 'All rights reserved.',
  },
  fr: {
    home: 'Accueil',
    about: 'À propos',
    products: 'Produits',
    news: 'Actualités',
    contact: 'Contact',
    join_our_team: 'Rejoignez-nous',
    privacy_policy: 'Politique de confidentialité',
    terms: 'Conditions d\'utilisation',
    all_rights_reserved: 'Tous droits réservés.',
  },
  ar: {
    home: 'الرئيسية',
    about: 'من نحن',
    products: 'المنتجات',
    news: 'أخبار',
    contact: 'اتصل بنا',
    join_our_team: 'انضم إلى فريقنا',
    privacy_policy: 'سياسة الخصوصية',
    terms: 'شروط الخدمة',
    all_rights_reserved: 'جميع الحقوق محفوظة.',
  },
  sw: {
    home: 'Nyumbani',
    about: 'Kuhusu Sisi',
    products: 'Bidhaa',
    news: 'Habari',
    contact: 'Wasiliana',
    join_our_team: 'Jiunge Nasi',
    privacy_policy: 'Sera ya Faragha',
    terms: 'Masharti ya Huduma',
    all_rights_reserved: 'Haki zote zimehifadhiwa.',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('vitorra-lang');
    if (savedLang && ['en', 'fr', 'ar', 'sw'].includes(savedLang)) {
      setLanguageState(savedLang as Language);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vitorra-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
