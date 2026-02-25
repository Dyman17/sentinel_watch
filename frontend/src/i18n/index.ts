/**
 * 🌐 Конфигурация i18next для локализации
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import ru from '../locales/ru.json';

const resources = {
  ru: {
    translation: ru
  },
  en: {
    translation: {
      // Можно добавить английские переводы
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru', // Русский по умолчанию
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React уже экранирует
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;
