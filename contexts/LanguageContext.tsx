import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, getTranslations, getLocalizedTripStatus, getLocalizedTripType, getLocalizedDriverStatus } from '../constants/i18n';

const LANG_KEY = '@alsharq_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslations>;
  tripStatus: (status: string) => string;
  tripType: (type: string) => string;
  driverStatus: (status: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(stored => {
      if (stored === 'en' || stored === 'ur' || stored === 'ar') {
        setLanguageState(stored);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
  }, []);

  const t = getTranslations(language);
  const tripStatus = useCallback((status: string) => getLocalizedTripStatus(status, language), [language]);
  const tripType = useCallback((type: string) => getLocalizedTripType(type, language), [language]);
  const driverStatus = useCallback((status: string) => getLocalizedDriverStatus(status, language), [language]);
  const isRTL = language === 'ar' || language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tripStatus, tripType, driverStatus, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
