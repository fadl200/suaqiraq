/**
 * VerificationQueue Component
 * Admin component to view pending verifications
 * Approve/reject verification requests
 * Shows product details for review
 */

import { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
    FileText,
    ChevronRight,
    X,
} from 'lucide-react';
import { useVerification } from '../../contexts/VerificationContext';
import { getProductById, getSellerById, formatPrice } from '../../store/data';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';

interface VerificationQueueProps {
    className?: string;
}

export function VerificationQueue({ className = '' }: VerificationQueueProps) {
    const { t, i18n } = useTranslation();
    const { pendingRequests, verify, reject, isLoading } = useVerification();
    const isAdmin = useStore((s) => s.isAdmin);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // If not admin, don't render
    if (!isAdmin) {
        return null;
    }

    // Handle approve
    const handleApprove = async (productId: string) => {
        const result = await verify(productId);

        if (result.success) {
            setSelectedRequest(null);
        }
    };

    // Handle reject
    const handleReject = async (productId: string) => {
        if (!rejectReason.trim()) {
            return;
        }

        const result = await reject(productId, rejectReason);

        if (result.success) {
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectReason('');
        }
    };

    // Get selected request details
    const selectedDetails = selectedRequest
        ? pendingRequests.find(r => r.id === selectedRequest)
        : null;

    const selectedProduct = selectedDetails
        ? getProductById(selectedDetails.productId)
        : null;

    const selectedSeller = selectedProduct
        ? getSellerById(selectedProduct.sellerId)
        : null;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-amber-500" />
                        <h3 className="font-bold text-gray-900">
                            {t('verification.queueTitle')}
                        </h3>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {pendingRequests.length} {t('verification.pending')}
                    </span>
                </div>
            </div>

            {/* Queue List */}
            <div className="divide-y divide-gray-50">
                {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center">
                        <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
                        <p className="text-gray-500">{t('verification.noPending')}</p>
                    </div>
                ) : (
                    pendingRequests.map((request) => {
                        const product = getProductById(request.productId);
                        const seller = product ? getSellerById(product.sellerId) : null;

                        if (!product) return null;

                        return (
                            <div
                                key={request.id}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRequest(request.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Product Image */}
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                                {i18n.language === 'ar' ? product.nameAr : product.name}
                                            </h4>
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                                {t('verification.pending')}
                                            </span>
                                        </div>

                                        {seller && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <User size={12} className="text-gray-400" />
                                                <span className="text-xs text-gray-500">{seller.name}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm font-semibold text-emerald-600">
                                                {formatPrice(product.price)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Requested Date */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            <span>{request.requestedAt}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 mt-2 ml-auto" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal */}
            {selectedDetails && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">
                                {t('verification.reviewRequest')}
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setShowRejectModal(false);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Product Details */}
                        <div className="p-4">
                            {/* Product Image */}
                            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                                <img
                                    src={selectedProduct.images[0]}
                                    alt={selectedProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">
                                        {i18n.language === 'ar' ? selectedProduct.nameAr : selectedProduct.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {i18n.language === 'ar' ? selectedProduct.descriptionAr : selectedProduct.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between py-2 border-y border-gray-100">
                                    <span className="text-gray-500">{t('verification.price')}</span>
                                    <span className="font-bold text-emerald-600">
                                        {formatPrice(selectedProduct.price)}
                                    </span>
                                </div>

                                {/* Seller Info */}
                                {selectedSeller && (
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={selectedSeller.avatar}
                                                alt={selectedSeller.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-gray-900">
                                                        {selectedSeller.name}
                                                    </span>
                                                    {selectedSeller.isVerified && (
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {selectedSeller.locationAr}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Documents */}
                                {selectedDetails.documents && selectedDetails.documents.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                            {t('verification.documents')}
                                        </h5>
                                        <div className="space-y-2">
                                            {selectedDetails.documents.map((doc, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                                >
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600">{doc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Request Info */}
                                <div className="text-xs text-gray-400">
                                    {t('verification.requestedOn')}: {selectedDetails.requestedAt}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
                            {showRejectModal ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder={t('verification.rejectReasonPlaceholder')}
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                                        rows={3}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRejectModal(false)}
                                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedDetails.productId)}
                                            disabled={!rejectReason.trim() || isLoading}
                                            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {isLoading ? t('common.loading') : t('verification.confirmReject')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isLoading}
                                        className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle size={18} className="inline mr-1" />
                                        {t('verification.reject')}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedDetails.productId)}
                                        disabled={isLoading}
                                        className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} className="inline mr-1" />
                                        {t('verification.approve')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VerificationQueue;
