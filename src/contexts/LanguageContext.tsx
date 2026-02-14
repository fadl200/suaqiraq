/**
 * Language Context for Iraqi Marketplace PWA
 * Provides language switching functionality, language preference persistence, and RTL/LTR direction handling
 */

import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode, LanguageConfig } from '../i18n';
import {
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    changeLanguage as i18nChangeLanguage,
} from '../i18n';
import { useStore } from '../store/useStore';

// ==================== Types ====================

interface LanguageContextValue {
    // Current language
    language: LanguageCode;
    languageConfig: LanguageConfig;
    direction: 'ltr' | 'rtl';
    isRtl: boolean;

    // Available languages
    supportedLanguages: LanguageConfig[];

    // Actions
    setLanguage: (lang: LanguageCode) => Promise<void>;
    toggleLanguage: () => Promise<void>;

    // Translation
    t: (key: string, options?: Record<string, unknown>) => string;

    // Helpers
    getDirectionalValue: <T>(ltrValue: T, rtlValue: T) => T;
    getDirectionalClass: (ltrClass: string, rtlClass: string) => string;
}

// ==================== Constants ====================

const LANGUAGE_STORAGE_KEY = 'iraq_marketplace_language';

// ==================== Context ====================

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// ==================== Provider ====================

interface LanguageProviderProps {
    children: React.ReactNode;
    defaultLanguage?: LanguageCode;
}

export function LanguageProvider({
    children,
    defaultLanguage = DEFAULT_LANGUAGE,
}: LanguageProviderProps) {
    const { t, i18n } = useTranslation();

    // Use Zustand store as the single source of truth for language
    const storeLanguage = useStore((s) => s.language);
    const setStoreLanguage = useStore((s) => s.setLanguage);
    const effectiveLanguage = storeLanguage || defaultLanguage;

    // Track direction locally
    const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
        const config = SUPPORTED_LANGUAGES.find(l => l.code === effectiveLanguage);
        return config?.direction || 'ltr';
    });

    // Ref to track current language for event handler (avoids dependency array issues)
    const languageRef = useRef(storeLanguage);
    languageRef.current = storeLanguage;

    // Set language - updates both i18n and Zustand store
    const setLanguage = useCallback(async (lang: LanguageCode) => {
        const config = SUPPORTED_LANGUAGES.find(l => l.code === lang);
        if (!config) {
            console.warn(`Language ${lang} is not supported`);
            return;
        }

        // Update i18n
        await i18nChangeLanguage(lang);

        // Update Zustand store (single source of truth)
        setStoreLanguage(lang);
        setDirection(config.direction);

        // Update document
        document.documentElement.dir = config.direction;
        document.documentElement.lang = lang;

        // Store preference
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }, [setStoreLanguage]);

    // Toggle between languages
    const toggleLanguage = useCallback(async () => {
        const newLang: LanguageCode = storeLanguage === 'en' ? 'ar' : 'en';
        await setLanguage(newLang);
    }, [storeLanguage, setLanguage]);

    // Get directional value based on current direction
    const getDirectionalValue = useCallback(<T,>(ltrValue: T, rtlValue: T): T => {
        return direction === 'rtl' ? rtlValue : ltrValue;
    }, [direction]);

    // Get directional class based on current direction
    const getDirectionalClass = useCallback((ltrClass: string, rtlClass: string): string => {
        return direction === 'rtl' ? rtlClass : ltrClass;
    }, [direction]);

    // Initialize language on mount
    useEffect(() => {
        const config = SUPPORTED_LANGUAGES.find(l => l.code === effectiveLanguage);
        if (config) {
            document.documentElement.dir = config.direction;
            document.documentElement.lang = effectiveLanguage;
        }
    }, []);

    // Sync with i18n language changes
    useEffect(() => {
        const handleLanguageChanged = () => {
            const currentLang = i18n.language as LanguageCode;
            // Use ref to access current language value (avoids dependency array issues)
            if (currentLang !== languageRef.current && SUPPORTED_LANGUAGES.some(l => l.code === currentLang)) {
                setStoreLanguage(currentLang);
                const config = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
                if (config) {
                    setDirection(config.direction);
                }
            }
        };

        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n, setStoreLanguage]);

    // Context value
    const value: LanguageContextValue = {
        language: storeLanguage,
        languageConfig: SUPPORTED_LANGUAGES.find(l => l.code === storeLanguage) || SUPPORTED_LANGUAGES[0],
        direction,
        isRtl: direction === 'rtl',
        supportedLanguages: SUPPORTED_LANGUAGES,
        setLanguage,
        toggleLanguage,
        t,
        getDirectionalValue,
        getDirectionalClass,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

// ==================== Hook ====================

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);

    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }

    return context;
}

// ==================== Utility Hooks ====================

/**
 * Hook to get current language code only
 */
export function useLanguageCode(): LanguageCode {
    const { language } = useLanguage();
    return language;
}

/**
 * Hook to get current direction only
 */
export function useDirection(): 'ltr' | 'rtl' {
    const { direction } = useLanguage();
    return direction;
}

/**
 * Hook to check if current language is RTL
 */
export function useIsRtl(): boolean {
    const { isRtl } = useLanguage();
    return isRtl;
}

/**
 * Hook to get translation function only
 */
export function useTranslationHook() {
    const { t } = useLanguage();
    return { t };
}

/**
 * Hook for directional styling
 */
export function useDirectionalStyle() {
    const { getDirectionalValue, getDirectionalClass, direction, isRtl } = useLanguage();

    return {
        direction,
        isRtl,
        getValue: getDirectionalValue,
        getClass: getDirectionalClass,
        // Common directional styles
        flexDirection: isRtl ? 'row-reverse' : 'row',
        textAlign: isRtl ? 'right' : 'left',
        marginStart: isRtl ? 'margin-right' : 'margin-left',
        marginEnd: isRtl ? 'margin-left' : 'margin-right',
        paddingStart: isRtl ? 'padding-right' : 'padding-left',
        paddingEnd: isRtl ? 'padding-left' : 'padding-right',
    };
}

// ==================== HOC ====================

/**
 * Higher-order component for components that need language context
 */
export function withLanguage<P extends object>(
    Component: React.ComponentType<P>
): React.FC<P> {
    return function WithLanguageComponent(props: P) {
        return (
            <LanguageProvider>
                <Component {...props} />
            </LanguageProvider>
        );
    };
}

// ==================== Directional Component ====================

interface DirectionalProps {
    ltr?: React.ReactNode;
    rtl?: React.ReactNode;
}

/**
 * Component that renders different content based on direction
 */
export function Directional({ ltr, rtl }: DirectionalProps): React.ReactElement | null {
    const { direction } = useLanguage();

    if (direction === 'rtl') {
        return <>{rtl || ltr}</>;
    }

    return <>{ltr || rtl}</>;
}

// ==================== Export ====================

export default LanguageContext;
