/**
 * VerifiedSellerList Component
 * Displays a list of all verified sellers with:
 * - Special styling for verified sellers
 * - Link to seller page
 * - Verification badge
 */

import { Star, MapPin, ShoppingBag, ChevronRight, CheckCircle } from 'lucide-react';
import { getSellerRatingSummary, type Seller } from '../../store/data';
import { useStore } from '../../store/useStore';
import { SellerBadge } from './SellerBadge';
import { t } from '../../i18n';

interface VerifiedSellerListProps {
    sellers: Seller[];
    onSellerClick?: (sellerId: string) => void;
    showAll?: boolean;
    limit?: number;
    className?: string;
}

export function VerifiedSellerList({
    sellers,
    onSellerClick,
    showAll = false,
    limit = 6,
    className = '',
}: VerifiedSellerListProps) {
    const language = useStore((s) => s.language);
    const navigate = useStore((s) => s.navigate);

    // Filter verified sellers and apply limit
    const verifiedSellers = sellers.filter(s => s.isVerified);
    const displayedSellers = showAll ? verifiedSellers : verifiedSellers.slice(0, limit);

    if (displayedSellers.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <p className="text-gray-500 text-sm">
                    {language === 'ar' ? 'لا يوجد بائعين موثقين حالياً' : 'No verified sellers at the moment'}
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle size={18} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            {language === 'ar' ? 'البائعون الموثقون' : 'Verified Sellers'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {verifiedSellers.length} {language === 'ar' ? 'بائع موثق' : 'verified sellers'}
                        </p>
                    </div>
                </div>

                {!showAll && verifiedSellers.length > limit && (
                    <button
                        onClick={() => onSellerClick?.('all')}
                        className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        <span>{language === 'ar' ? 'عرض الكل' : 'See All'}</span>
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {/* Sellers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayedSellers.map((seller) => {
                    const { average, count } = getSellerRatingSummary(seller.id);
                    return (
                        <div
                            key={seller.id}
                            onClick={() => {
                                navigate('seller', { sellerId: seller.id });
                                onSellerClick?.(seller.id);
                            }}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
                        >
                        {/* Cover with gradient */}
                        <div className="relative h-16 overflow-hidden">
                            <img
                                src={seller.coverImage}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                            {/* Verified badge overlay */}
                            <div className="absolute top-2 right-2">
                                <SellerBadge isVerified={true} size="sm" />
                            </div>
                        </div>

                        {/* Seller Info */}
                        <div className="relative px-3 pb-3">
                            {/* Avatar */}
                            <div className="flex items-end gap-2 -mt-5">
                                <img
                                    src={seller.avatar}
                                    alt={seller.name}
                                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                                />
                                <div className="flex-1 pt-2 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 truncate">
                                        {language === 'ar' ? seller.nameAr : seller.name}
                                    </h4>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="font-medium text-gray-700">{average.toFixed(1)}</span>
                                    <span className="text-[10px] text-gray-400">({count})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={11} />
                                    <span>{language === 'ar' ? seller.locationAr : seller.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShoppingBag size={11} />
                                    <span>{seller.productCount} {language === 'ar' ? 'منتج' : 'products'}</span>
                                </div>
                            </div>

                            {/* Delivery info */}
                            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <span>{seller.deliveryInfo || t('seller.deliveryToAllIraq')}</span>
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Compact verified seller badge list
 */
export function VerifiedSellerBadges({
    sellers,
    onSellerClick,
    maxVisible = 5,
    className = '',
}: {
    sellers: Seller[];
    onSellerClick?: (sellerId: string) => void;
    maxVisible?: number;
    className?: string;
}) {
    const language = useStore((s) => s.language);
    const navigate = useStore((s) => s.navigate);
    const verifiedSellers = sellers.filter(s => s.isVerified);
    const visibleSellers = verifiedSellers.slice(0, maxVisible);
    const remainingCount = verifiedSellers.length - maxVisible;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {visibleSellers.map((seller) => (
                <button
                    key={seller.id}
                    onClick={() => {
                        navigate('seller', { sellerId: seller.id });
                        onSellerClick?.(seller.id);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                >
                    <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium text-emerald-700 truncate max-w-[80px]">
                        {language === 'ar' ? seller.nameAr : seller.name}
                    </span>
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            ))}

            {remainingCount > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                    +{remainingCount} {language === 'ar' ? 'آخرون' : 'others'}
                </span>
            )}
        </div>
    );
}

export default VerifiedSellerList;
