/**
 * ViewCounter Component - Displays view count with eye icon
 * 
 * Shows formatted view count (1K, 1M, etc.) with support for
 * both Arabic and English languages.
 */

import { Eye } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatViewCount } from '../../services/viewsService';

interface ViewCounterProps {
    /** The view count to display */
    count: number;
    /** Whether to show the eye icon */
    showIcon?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to use dark theme (for overlay) */
    dark?: boolean;
    /** Custom className */
    className?: string;
    /** Whether to show "views" label */
    showLabel?: boolean;
}

export function ViewCounter({
    count,
    showIcon = true,
    size = 'sm',
    dark = false,
    className = '',
    showLabel = false,
}: ViewCounterProps) {
    const language = useStore((s) => s.language);

    // Format the count based on language
    const formattedCount = formatViewCount(count, language);

    // Size classes
    const sizeClasses = {
        sm: {
            icon: 'w-3 h-3',
            text: 'text-[10px]',
            gap: 'gap-0.5',
            padding: 'px-2 py-0.5',
        },
        md: {
            icon: 'w-4 h-4',
            text: 'text-xs',
            gap: 'gap-1',
            padding: 'px-2.5 py-1',
        },
        lg: {
            icon: 'w-5 h-5',
            text: 'text-sm',
            gap: 'gap-1.5',
            padding: 'px-3 py-1.5',
        },
    };

    const sizeConfig = sizeClasses[size];

    // Theme classes
    const themeClasses = dark
        ? 'bg-black/50 backdrop-blur-sm text-white/90'
        : 'bg-gray-100 text-gray-600';

    const iconColor = dark ? 'text-white/80' : 'text-gray-500';

    // Get the "views" label based on language
    const viewsLabel = language === 'ar' ? 'مشاهدة' : 'views';

    return (
        <div
            className={`
        inline-flex items-center justify-center rounded-full
        ${sizeConfig.gap}
        ${sizeConfig.padding}
        ${themeClasses}
        ${className}
      `}
            title={`${count.toLocaleString()} ${viewsLabel}`}
        >
            {showIcon && (
                <Eye className={`${sizeConfig.icon} ${iconColor}`} />
            )}
            <span className={`${sizeConfig.text} font-medium`}>
                {formattedCount}
                {showLabel && (
                    <span className="ml-1 opacity-80">
                        {language === 'ar' ? ' مشاهدة' : ' views'}
                    </span>
                )}
            </span>
        </div>
    );
}

/**
 * ViewCounterInline - A simpler inline version without background
 */
export function ViewCounterInline({
    count,
    showIcon = true,
    size = 'sm',
    className = '',
}: Omit<ViewCounterProps, 'dark' | 'showLabel'>) {
    const language = useStore((s) => s.language);

    const formattedCount = formatViewCount(count, language);

    const sizeClasses = {
        sm: { icon: 'w-3 h-3', text: 'text-[10px]' },
        md: { icon: 'w-4 h-4', text: 'text-xs' },
        lg: { icon: 'w-5 h-5', text: 'text-sm' },
    };

    const sizeConfig = sizeClasses[size];

    return (
        <span
            className={`inline-flex items-center gap-1 ${className}`}
            title={`${count.toLocaleString()} ${language === 'ar' ? 'مشاهدة' : 'views'}`}
        >
            {showIcon && (
                <Eye className={`${sizeConfig.icon} text-gray-400`} />
            )}
            <span className={`${sizeConfig.text} text-gray-500 font-medium`}>
                {formattedCount}
            </span>
        </span>
    );
}

export default ViewCounter;
