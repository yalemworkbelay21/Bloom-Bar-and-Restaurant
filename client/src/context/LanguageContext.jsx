import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('bloom_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    const valid = lang === 'am' ? 'am' : 'en';
    setLanguageState(valid);
    try {
      localStorage.setItem('bloom_language', valid);
    } catch (_) {}
  };

  /**
   * Dot-notation translation resolver
   * e.g. t('common.save') -> "Save" or "አስቀምጥ"
   */
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    let curr = translations[language];
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        // Fallback to English dictionary
        let eng = translations['en'];
        for (const ep of parts) {
          if (eng && typeof eng === 'object' && ep in eng) {
            eng = eng[ep];
          } else {
            return fallback || path;
          }
        }
        return eng || fallback || path;
      }
    }
    return curr || fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isAmharic: language === 'am' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (path, fallback = '') => fallback || path,
      isAmharic: false,
    };
  }
  return context;
};
