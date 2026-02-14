/**
 * SellerInfo Component
 * Displays seller information card with:
 * - Store name
 * - Phone number
 * - Delivery info
 * - Product count
 * - Verification badge (if verified)
 */

import { Phone, Package, Truck, MapPin, Calendar } from 'lucide-react';
import { type Seller } from '../../store/data';
import { useStore } from '../../store/useStore';
import { SellerBadge } from './SellerBadge';
import { t } from '../../i18n';

interface SellerInfoProps {
    seller: Seller;
    /** Show full details or compact version */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export function SellerInfo({ seller, compact = false, className = '' }: SellerInfoProps) {
    const language = useStore((s) => s.language);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            {/* Header with avatar and name */}
            <div className="p-4 flex items-center gap-3">
                <img
                    src={seller.avatar}
                    alt={seller.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                            {language === 'ar' ? seller.nameAr : seller.name}
                        </h3>
                        {seller.isVerified && (
                            <SellerBadge isVerified={true} size="sm" showLabel={false} />
                        )}
                    </div>
                    {seller.isVerified && (
                        <span className="text-xs text-emerald-600 font-medium">
                            {t('seller.verified')}
                        </span>
                    )}
                </div>
            </div>

            {/* Info items */}
            <div className="px-4 pb-4 space-y-2">
                {/* Delivery Info */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Truck size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-gray-500 text-xs block">{language === 'ar' ? 'التوصيل' : 'Delivery'}</span>
                        <span className="text-gray-900 font-medium text-sm">
                            {seller.deliveryInfo || t('seller.deliveryToAllIraq')}
                        </span>
                    </div>
                </div>

                {/* Product Count */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-gray-500 text-xs block">{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                        <span className="text-gray-900 font-medium text-sm">
                            {seller.productCount} {language === 'ar' ? 'منتج' : 'products'}
                        </span>
                    </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Phone size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-gray-500 text-xs block">{language === 'ar' ? 'الهاتف' : 'Phone'}</span>
                        <span className="text-gray-900 font-medium text-sm" dir="ltr">
                            +{seller.whatsapp}
                        </span>
                    </div>
                </div>

                {/* Location - only in non-compact mode */}
                {!compact && (
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-gray-500 text-xs block">{language === 'ar' ? 'الموقع' : 'Location'}</span>
                            <span className="text-gray-900 font-medium text-sm">
                                {language === 'ar' ? seller.locationAr : seller.location}
                            </span>
                        </div>
                    </div>
                )}

                {/* Joined Date - only in non-compact mode */}
                {!compact && (
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Calendar size={16} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-gray-500 text-xs block">{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</span>
                            <span className="text-gray-900 font-medium text-sm">
                                {new Date(seller.joinedDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Verified Seller Banner */}
            {seller.isVerified && !compact && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2">
                    <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>{t('seller.verified')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Compact seller info for inline display
 */
export function SellerInfoInline({ seller, className = '' }: { seller: Seller; className?: string }) {
    const language = useStore((s) => s.language);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src={seller.avatar}
                alt={seller.name}
                className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                        {language === 'ar' ? seller.nameAr : seller.name}
                    </span>
                    {seller.isVerified && (
                        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
                <span className="text-xs text-gray-500">
                    {seller.deliveryInfo || t('seller.deliveryToAllIraq')}
                </span>
            </div>
        </div>
    );
}

export default SellerInfo;
