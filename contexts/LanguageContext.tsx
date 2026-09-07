// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, Translations, getTranslations, DEFAULT_LANGUAGE } from '@/constants/languages';

interface LanguageContextType {
  language: LanguageCode;
  t: Translations;
  isRTL: boolean;
  setLanguage: (lang: LanguageCode) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const RTL_LANGS: LanguageCode[] = ['ur', 'ar', 'fa', 'ps', 'sd', 'bal'];
  const isRTL = RTL_LANGS.includes(language);
  const t = getTranslations(language);

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(stored => {
      if (stored) setLanguageState(stored as LanguageCode);
    });
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem('app_language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, isRTL, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
