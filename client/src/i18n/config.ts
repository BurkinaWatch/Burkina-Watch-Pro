
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';
import dioula from './locales/dioula.json';
import moore from './locales/moore.json';
import fulfulde from './locales/fulfulde.json';

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      dioula: { translation: dioula },
      moore: { translation: moore },
      fulfulde: { translation: fulfulde },
    },
    fallbackLng: 'fr',
    lng: localStorage.getItem('burkina-watch-language') || 'fr',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'burkina-watch-language',
    },
  });

export default i18next;
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import moore from './locales/moore.json';
import dioula from './locales/dioula.json';
import fulfulde from './locales/fulfulde.json';

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      moore: { translation: moore },
      dioula: { translation: dioula },
      fulfulde: { translation: fulfulde }
    },
    fallbackLng: 'fr',
    lng: localStorage.getItem('language') || 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
