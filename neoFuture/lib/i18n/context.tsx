'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'hi' | 'mr' | 'te';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

import enMessages from '../../messages/en.json';
import hiMessages from '../../messages/hi.json';
import mrMessages from '../../messages/mr.json';
import teMessages from '../../messages/te.json';

const messages: Record<Locale, any> = {
  en: enMessages,
  hi: hiMessages,
  mr: mrMessages,
  te: teMessages,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['en', 'hi', 'mr', 'te'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[locale];
    for (const k of keys) value = value?.[k];
    if (value && typeof value === 'string') return value;

    // Fallback to English
    let fallback: any = messages['en'];
    for (const k of keys) fallback = fallback?.[k];
    return (fallback && typeof fallback === 'string') ? fallback : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}