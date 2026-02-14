/**
 * i18n Configuration for Iraqi Marketplace PWA
 * Sets up i18next with React, Arabic and English languages, and RTL support
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// ==================== Types ====================

export type LanguageCode = 'en' | 'ar';

export interface LanguageConfig {
    code: LanguageCode;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
}

// ==================== Constants ====================

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
    },
    {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
    },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'ar'; // Arabic as default for Iraqi marketplace

// ==================== i18n Configuration ====================

const resources = {
    en: {
        translation: enTranslations,
    },
    ar: {
        translation: arTranslations,
    },
};

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'translation',

        // Language detection options
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'iraq_marketplace_language',
            caches: ['localStorage'],
            htmlTag: document.documentElement,
        },

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        // React options
        react: {
            useSuspense: true,
            bindI18n: 'languageChanged loaded',
            bindI18nStore: 'added removed',
        },

        // Debug in development
        debug: import.meta.env?.DEV || false,

        // Load language
        load: 'languageOnly',

        // Non-string values as objects
        returnObjects: true,

        // Missing key handling
        saveMissing: true,
        missingKeyHandler: (lng, _ns, key) => {
            if (import.meta.env?.DEV) {
                console.warn(`Missing translation key: ${key} for language: ${lng}`);
            }
        },
    });

// ==================== Helper Functions ====================

/**
 * Get current language configuration
 */
export function getCurrentLanguage(): LanguageConfig {
    const currentLang = i18n.language as LanguageCode;
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang) || SUPPORTED_LANGUAGES[0];
}

/**
 * Get current language direction
 */
export function getCurrentDirection(): 'ltr' | 'rtl' {
    return getCurrentLanguage().direction;
}

/**
 * Check if current language is RTL
 */
export function isRtl(): boolean {
    return getCurrentDirection() === 'rtl';
}

/**
 * Change language
 */
export async function changeLanguage(lang: LanguageCode): Promise<void> {
    await i18n.changeLanguage(lang);

    // Update document direction
    document.documentElement.dir = getCurrentDirection();
    document.documentElement.lang = lang;

    // Store preference
    localStorage.setItem('iraq_marketplace_language', lang);
}

/**
 * Get translation by key
 */
export function t(key: string, options?: Record<string, unknown>): string {
    return i18n.t(key, options);
}

/**
 * Get translation with namespace
 */
export function tNs(namespace: string, key: string, options?: Record<string, unknown>): string {
    return i18n.t(`${namespace}:${key}`, options);
}

/**
 * Check if key exists
 */
export function hasTranslation(key: string): boolean {
    return i18n.exists(key);
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
}

// ==================== Initialize Direction ====================

// Set initial direction based on stored or default language
const storedLang = localStorage.getItem('iraq_marketplace_language') as LanguageCode | null;
const initialLang = storedLang || DEFAULT_LANGUAGE;
const initialConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === initialLang);

if (initialConfig) {
    document.documentElement.dir = initialConfig.direction;
    document.documentElement.lang = initialConfig.code;
}

// ==================== Export ====================

export default i18n;
