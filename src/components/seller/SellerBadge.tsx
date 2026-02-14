/**
 * SellerBadge Component
 * Displays a verified seller badge with special styling
 * Shows "Verified Seller" text with a checkmark icon
 */

import { useStore } from '../../store/useStore';
import { t } from '../../i18n';

interface SellerBadgeProps {
    isVerified: boolean;
    /** Size variant: small (inline), medium (default), large (prominent) */
    size?: 'sm' | 'md' | 'lg';
    /** Show text label alongside the badge */
    showLabel?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export function SellerBadge({
    isVerified,
    size = 'md',
    showLabel = false,
    className = ''
}: SellerBadgeProps) {
    const language = useStore((s) => s.language);

    if (!isVerified) {
        // For unverified sellers, show a subtle indicator or nothing
        return showLabel ? (
            <span className={`inline-flex items-center gap-1 text-gray-400 ${className}`}>
                <svg className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">{language === 'ar' ? 'غير موثق' : 'Unverified'}</span>
            </span>
        ) : null;
    }

    // Size classes
    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        md: 'text-xs px-2 py-1 gap-1',
        lg: 'text-sm px-3 py-1.5 gap-1.5',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <span
            className={`
        inline-flex items-center 
        bg-gradient-to-r from-emerald-500 to-teal-500 
        text-white 
        rounded-full 
        font-semibold
        shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {/* Checkmark icon */}
            <svg
                className={iconSizes[size]}
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>

            {showLabel && (
                <span>{t('seller.verified')}</span>
            )}
        </span>
    );
}

/**
 * Compact inline badge for use in product cards and lists
 */
export function VerifiedBadgeInline({ isVerified, className = '' }: { isVerified: boolean; className?: string }) {
    if (!isVerified) return null;

    return (
        <svg
            className={`w-4 h-4 text-emerald-500 flex-shrink-0 ${className}`}
            viewBox="0 0 20 20"
            fill="currentColor"
        >
            <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
            />
        </svg>
    );
}

export default SellerBadge;
