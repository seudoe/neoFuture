'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useI18n();

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: 'en' | 'hi' | 'mr' | 'te') => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <span className="text-xs sm:text-sm font-medium text-gray-700 sm:hidden">
          {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code as 'en' | 'hi' | 'mr' | 'te')}
                  className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                    language.code === locale 
                      ? 'bg-green-50 text-green-700 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{language.nativeName}</span>
                    <span className="text-xs text-gray-500 hidden sm:inline">{language.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}