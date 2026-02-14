/**
 * VerificationStatus Component
 * Displays detailed verification status for a product
 * Shows pending/verified/rejected status with verification date
 */

import { CheckCircle, Clock, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { VerificationStatus } from '../../store/data';
import { useTranslation } from 'react-i18next';

interface VerificationStatusProps {
    status: VerificationStatus;
    verifiedAt?: string;
    rejectionReason?: string;
    showDate?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function VerificationStatusDisplay({
    status,
    verifiedAt,
    rejectionReason,
    showDate = true,
    size = 'md',
    className = '',
}: VerificationStatusProps) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    // Size configurations
    const sizeConfig = {
        sm: {
            icon: 14,
            text: 'text-xs',
            title: 'text-sm',
            gap: 'gap-2',
        },
        md: {
            icon: 18,
            text: 'text-sm',
            title: 'text-base',
            gap: 'gap-3',
        },
        lg: {
            icon: 22,
            text: 'text-base',
            title: 'text-lg',
            gap: 'gap-3',
        },
    };

    const config = sizeConfig[size];

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Status configurations
    const statusConfig = {
        verified: {
            icon: CheckCircle,
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            iconColor: 'text-emerald-500',
            titleColor: 'text-emerald-700',
            textColor: 'text-emerald-600',
            title: t('verification.verifiedTitle'),
            description: t('verification.verifiedDescription'),
        },
        pending: {
            icon: Clock,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            iconColor: 'text-amber-500',
            titleColor: 'text-amber-700',
            textColor: 'text-amber-600',
            title: t('verification.pendingTitle'),
            description: t('verification.pendingDescription'),
        },
        rejected: {
            icon: XCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-500',
            titleColor: 'text-red-700',
            textColor: 'text-red-600',
            title: t('verification.rejectedTitle'),
            description: rejectionReason || t('verification.rejectedDescription'),
        },
        none: {
            icon: AlertCircle,
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            iconColor: 'text-gray-400',
            titleColor: 'text-gray-600',
            textColor: 'text-gray-500',
            title: t('verification.notVerifiedTitle'),
            description: t('verification.notVerifiedDescription'),
        },
    };

    const statusConf = statusConfig[status];
    const Icon = statusConf.icon;

    return (
        <div
            className={`
        rounded-xl border ${statusConf.borderColor} ${statusConf.bgColor}
        p-4 ${config.gap} flex flex-col
        ${className}
      `}
        >
            <div className={`flex items-center ${config.gap}`}>
                <div className={`p-2 rounded-full ${statusConf.bgColor}`}>
                    <Icon size={config.icon} className={statusConf.iconColor} />
                </div>
                <div className="flex-1">
                    <h4 className={`font-semibold ${config.title} ${statusConf.titleColor}`}>
                        {statusConf.title}
                    </h4>
                    <p className={`${config.text} ${statusConf.textColor}`}>
                        {statusConf.description}
                    </p>
                </div>
            </div>

            {/* Show verification date for verified products */}
            {status === 'verified' && verifiedAt && showDate && (
                <div className={`flex items-center gap-1.5 mt-2 ${config.text} ${statusConf.textColor}`}>
                    <Calendar size={14} />
                    <span>
                        {t('verification.verifiedOn')} {formatDate(verifiedAt)}
                    </span>
                </div>
            )}

            {/* Show rejection reason if available */}
            {status === 'rejected' && rejectionReason && (
                <div className={`mt-2 p-2 rounded-lg bg-red-100 ${config.text} text-red-700`}>
                    <span className="font-medium">{t('verification.reason')}: </span>
                    {rejectionReason}
                </div>
            )}
        </div>
    );
}

/**
 * Inline verification status for compact display
 */
interface InlineStatusProps {
    status: VerificationStatus;
    verifiedAt?: string;
}

export function InlineVerificationStatus({ status, verifiedAt }: InlineStatusProps) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const verifiedOnTitle =
        status === 'verified' && verifiedAt
            ? `${t('verification.verifiedOn')} ${new Date(verifiedAt).toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US')}`
            : undefined;

    const statusConfig = {
        verified: {
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            label: t('verification.verified'),
        },
        pending: {
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            label: t('verification.pending'),
        },
        rejected: {
            icon: XCircle,
            color: 'text-red-500',
            bg: 'bg-red-50',
            label: t('verification.rejected'),
        },
        none: {
            icon: AlertCircle,
            color: 'text-gray-400',
            bg: 'bg-gray-50',
            label: t('verification.notVerified'),
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}
            title={verifiedOnTitle}
        >
            <Icon size={12} className={config.color} />
            <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        </span>
    );
}

export default VerificationStatusDisplay;
