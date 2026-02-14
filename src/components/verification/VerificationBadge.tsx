/**
 * VerificationBadge Component
 * Displays a verification badge for verified products
 * Shows different styles for different verification statuses
 */

import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { VerificationStatus } from '../../store/data';
import { useTranslation } from 'react-i18next';

interface VerificationBadgeProps {
    status: VerificationStatus;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}

export function VerificationBadge({
    status,
    size = 'md',
    showLabel = false,
    animated = true,
    className = ''
}: VerificationBadgeProps) {
    const { t } = useTranslation();

    // Size configurations
    const sizeConfig = {
        sm: {
            icon: 12,
            text: 'text-[10px]',
            padding: 'px-1.5 py-0.5',
            gap: 'gap-0.5',
        },
        md: {
            icon: 14,
            text: 'text-xs',
            padding: 'px-2 py-0.5',
            gap: 'gap-1',
        },
        lg: {
            icon: 16,
            text: 'text-sm',
            padding: 'px-2.5 py-1',
            gap: 'gap-1',
        },
    };

    const config = sizeConfig[size];

    // Status configurations
    const statusConfig = {
        verified: {
            icon: CheckCircle,
            bgColor: 'bg-emerald-500',
            textColor: 'text-white',
            borderColor: 'border-emerald-600',
            label: t('verification.verified'),
            shadowColor: 'shadow-emerald-200',
        },
        pending: {
            icon: Clock,
            bgColor: 'bg-amber-500',
            textColor: 'text-white',
            borderColor: 'border-amber-600',
            label: t('verification.pending'),
            shadowColor: 'shadow-amber-200',
        },
        rejected: {
            icon: XCircle,
            bgColor: 'bg-red-500',
            textColor: 'text-white',
            borderColor: 'border-red-600',
            label: t('verification.rejected'),
            shadowColor: 'shadow-red-200',
        },
        none: {
            icon: AlertCircle,
            bgColor: 'bg-gray-400',
            textColor: 'text-white',
            borderColor: 'border-gray-500',
            label: t('verification.notVerified'),
            shadowColor: 'shadow-gray-200',
        },
    };

    const statusConf = statusConfig[status];
    const Icon = statusConf.icon;

    // Don't render for 'none' status unless showLabel is true
    if (status === 'none' && !showLabel) {
        return null;
    }

    return (
        <span
            className={`
        inline-flex items-center justify-center rounded-full font-medium
        ${config.padding} ${config.gap} ${config.text}
        ${statusConf.bgColor} ${statusConf.textColor}
        border ${statusConf.borderColor}
        shadow-sm ${statusConf.shadowColor}
        ${animated ? 'animate-fade-in' : ''}
        ${className}
      `}
            title={statusConf.label}
        >
            <Icon size={config.icon} className={animated && status === 'verified' ? 'animate-pulse-once' : ''} />
            {showLabel && (
                <span className="truncate">{statusConf.label}</span>
            )}
        </span>
    );
}

/**
 * Compact verification badge for product cards
 * Shows only the checkmark for verified products
 */
interface CompactBadgeProps {
    isVerified: boolean;
    size?: 'sm' | 'md';
}

export function CompactVerificationBadge({ isVerified, size = 'sm' }: CompactBadgeProps) {
    if (!isVerified) return null;

    const iconSize = size === 'sm' ? 14 : 16;

    return (
        <span className="absolute top-2 left-2 bg-emerald-500 rounded-full p-0.5 shadow-md animate-scale-in">
            <CheckCircle size={iconSize} className="text-white" />
        </span>
    );
}

/**
 * Animated verification badge that appears with a pop effect
 */
export function AnimatedVerificationBadge({ status }: { status: VerificationStatus }) {
    if (status !== 'verified') return null;

    return (
        <span className="relative inline-flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full bg-emerald-500 p-1">
                <CheckCircle size={16} className="text-white" />
            </span>
        </span>
    );
}

export default VerificationBadge;
