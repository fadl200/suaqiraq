/**
 * Language Toggle Component for Iraqi Marketplace PWA
 * Provides a toggle button for switching languages with current language display
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { LanguageCode } from '../i18n';

// ==================== Types ====================

interface LanguageToggleProps {
    variant?: 'default' | 'compact' | 'dropdown';
    showFlag?: boolean;
    showName?: boolean;
    className?: string;
    buttonClassName?: string;
}

interface LanguageOptionProps {
    lang: { code: LanguageCode; name: string; nativeName: string };
    isSelected: boolean;
    onClick: () => void;
    showFlag: boolean;
    showName: boolean;
}

// ==================== Constants ====================

const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
    en: '🇬🇧',
    ar: '🇮🇶',
};

// ==================== Language Option Component ====================

function LanguageOption({
    lang,
    isSelected,
    onClick,
    showFlag,
    showName,
}: LanguageOptionProps): React.ReactElement {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full text-left
        ${isSelected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }
      `}
        >
            {showFlag && (
                <span className="text-lg">{LANGUAGE_FLAGS[lang.code]}</span>
            )}
            {showName && (
                <span className="text-sm font-medium">
                    {lang.nativeName}
                </span>
            )}
            {isSelected && (
                <svg
                    className="w-4 h-4 ml-auto text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            )}
        </button>
    );
}

// ==================== Default Toggle ====================

function DefaultToggle({
    showFlag,
    showName,
    className,
    buttonClassName,
}: Omit<LanguageToggleProps, 'variant'>): React.ReactElement {
    const { language, languageConfig, toggleLanguage, isRtl } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-xl
        bg-white border border-gray-200 shadow-sm
        hover:bg-gray-50 active:scale-95
        transition-all duration-200
        ${className || ''}
        ${buttonClassName || ''}
      `}
            title={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
        >
            {showFlag && (
                <span className="text-lg">{LANGUAGE_FLAGS[language]}</span>
            )}
            {showName && (
                <span className="text-sm font-medium text-gray-700">
                    {languageConfig.nativeName}
                </span>
            )}
            <svg
                className={`w-4 h-4 text-gray-400 ${isRtl ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
            </svg>
        </button>
    );
}

// ==================== Compact Toggle ====================

function CompactToggle({
    className,
    buttonClassName,
}: Omit<LanguageToggleProps, 'variant'>): React.ReactElement {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`
        flex items-center justify-center w-10 h-10 rounded-xl
        bg-white border border-gray-200 shadow-sm
        hover:bg-gray-50 active:scale-95
        transition-all duration-200
        ${className || ''}
        ${buttonClassName || ''}
      `}
            title={`Current: ${language.toUpperCase()} - Click to switch`}
        >
            <span className="text-sm font-bold text-gray-700">
                {language.toUpperCase()}
            </span>
        </button>
    );
}

// ==================== Dropdown Toggle ====================

function DropdownToggle({
    showFlag = true,
    showName = true,
    className,
    buttonClassName,
}: Omit<LanguageToggleProps, 'variant'>): React.ReactElement {
    const { language, supportedLanguages, setLanguage, isRtl } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (langCode: LanguageCode) => {
        await setLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className || ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white border border-gray-200 shadow-sm
          hover:bg-gray-50 active:scale-95
          transition-all duration-200
          ${buttonClassName || ''}
        `}
            >
                {showFlag && (
                    <span className="text-lg">{LANGUAGE_FLAGS[language]}</span>
                )}
                {showName && (
                    <span className="text-sm font-medium text-gray-700">
                        {supportedLanguages.find(l => l.code === language)?.nativeName}
                    </span>
                )}
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div
                    className={`
            absolute top-full mt-2 py-1 bg-white rounded-xl shadow-lg border border-gray-100
            min-w-[140px] z-50 animate-fade-in
            ${isRtl ? 'left-0' : 'right-0'}
          `}
                >
                    {supportedLanguages.map(lang => (
                        <LanguageOption
                            key={lang.code}
                            lang={lang}
                            isSelected={lang.code === language}
                            onClick={() => handleSelect(lang.code)}
                            showFlag={showFlag}
                            showName={showName}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== Main Component ====================

export function LanguageToggle({
    variant = 'default',
    showFlag = true,
    showName = true,
    className,
    buttonClassName,
}: LanguageToggleProps): React.ReactElement {
    switch (variant) {
        case 'compact':
            return (
                <CompactToggle
                    showFlag={showFlag}
                    showName={showName}
                    className={className}
                    buttonClassName={buttonClassName}
                />
            );
        case 'dropdown':
            return (
                <DropdownToggle
                    showFlag={showFlag}
                    showName={showName}
                    className={className}
                    buttonClassName={buttonClassName}
                />
            );
        default:
            return (
                <DefaultToggle
                    showFlag={showFlag}
                    showName={showName}
                    className={className}
                    buttonClassName={buttonClassName}
                />
            );
    }
}

// ==================== Convenience Components ====================

/**
 * Simple language badge showing current language
 */
export function LanguageBadge({
    className,
}: {
    className?: string;
}): React.ReactElement {
    const { language, languageConfig } = useLanguage();

    return (
        <span
            className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-lg
        bg-gray-100 text-gray-600 text-xs font-medium
        ${className || ''}
      `}
        >
            <span>{LANGUAGE_FLAGS[language]}</span>
            <span>{languageConfig.nativeName}</span>
        </span>
    );
}

/**
 * Language selector for settings pages
 */
export function LanguageSelector({
    className,
}: {
    className?: string;
}): React.ReactElement {
    const { language, supportedLanguages, setLanguage, t } = useLanguage();

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.language')}
            </label>
            <div className="grid grid-cols-2 gap-2">
                {supportedLanguages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`
              flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
              ${lang.code === language
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }
            `}
                    >
                        <span className="text-xl">{LANGUAGE_FLAGS[lang.code]}</span>
                        <div className="text-left">
                            <div className="text-sm font-medium">{lang.nativeName}</div>
                            <div className="text-xs text-gray-500">{lang.name}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ==================== Export ====================

export default LanguageToggle;
