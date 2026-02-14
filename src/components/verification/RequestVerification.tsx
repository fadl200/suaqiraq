/**
 * RequestVerification Component
 * Button/form to request product verification
 * Shows status of request and displays requirements
 */

import { useState } from 'react';
import { ShieldCheck, Upload, FileText, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { VerificationStatus } from '../../store/data';
import { useVerification } from '../../contexts/VerificationContext';
import { useTranslation } from 'react-i18next';

interface RequestVerificationProps {
    productId: string;
    sellerId: string;
    currentStatus: VerificationStatus;
    onRequested?: () => void;
    className?: string;
}

export function RequestVerification({
    productId,
    sellerId,
    currentStatus,
    onRequested,
    className = '',
}: RequestVerificationProps) {
    const { t } = useTranslation();
    const { requestVerification, reRequest, isLoading } = useVerification();
    const [showForm, setShowForm] = useState(false);
    const [documents] = useState<string[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Handle verification request
    const handleRequest = async () => {
        setMessage(null);

        let result;
        if (currentStatus === 'rejected') {
            result = await reRequest(productId, sellerId, documents);
        } else {
            result = await requestVerification(productId, sellerId, documents);
        }

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setShowForm(false);
            onRequested?.();
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    // Render based on current status
    const renderStatusButton = () => {
        switch (currentStatus) {
            case 'verified':
                return (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                        <CheckCircle size={18} />
                        <span className="font-medium">{t('verification.verified')}</span>
                    </div>
                );

            case 'pending':
                return (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
                        <Clock size={18} />
                        <span className="font-medium">{t('verification.pendingReview')}</span>
                    </div>
                );

            case 'rejected':
                return (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
                    >
                        <AlertTriangle size={18} />
                        <span className="font-medium">{t('verification.reRequest')}</span>
                    </button>
                );

            case 'none':
            default:
                return (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
                    >
                        <ShieldCheck size={18} />
                        <span className="font-medium">{t('verification.requestVerification')}</span>
                    </button>
                );
        }
    };

    // Don't show anything for verified products
    if (currentStatus === 'verified') {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                    <CheckCircle size={20} />
                    <div>
                        <span className="font-medium">{t('verification.productVerified')}</span>
                        <p className="text-xs text-emerald-500">{t('verification.verifiedBenefits')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Status Button */}
            {renderStatusButton()}

            {/* Message Display */}
            {message && (
                <div
                    className={`flex items-center gap-2 p-3 rounded-xl ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertTriangle size={16} />
                    )}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            {/* Request Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('verification.requestTitle')}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Requirements */}
                        <div className="bg-blue-50 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-semibold text-blue-700 mb-2">
                                {t('verification.requirements')}
                            </h4>
                            <ul className="text-xs text-blue-600 space-y-1">
                                <li className="flex items-center gap-1">
                                    <FileText size={12} />
                                    {t('verification.requirementInvoice')}
                                </li>
                                <li className="flex items-center gap-1">
                                    <FileText size={12} />
                                    {t('verification.requirementPhotos')}
                                </li>
                                <li className="flex items-center gap-1">
                                    <FileText size={12} />
                                    {t('verification.requirementDescription')}
                                </li>
                            </ul>
                        </div>

                        {/* Document Upload (Mock) */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                {t('verification.uploadDocuments')}
                            </label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors cursor-pointer">
                                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                    {t('verification.dragDrop')}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('verification.supportedFormats')}
                                </p>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                            <h4 className="text-sm font-semibold text-emerald-700 mb-2">
                                {t('verification.benefitsTitle')}
                            </h4>
                            <ul className="text-xs text-emerald-600 space-y-1">
                                <li>✓ {t('verification.benefit1')}</li>
                                <li>✓ {t('verification.benefit2')}</li>
                                <li>✓ {t('verification.benefit3')}</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleRequest}
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? t('common.loading') : t('verification.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RequestVerification;
