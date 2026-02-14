import { Star, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { getSellerRatingSummary, type Seller } from '../store/data';
import { useStore } from '../store/useStore';
import { SellerBadge } from './seller/SellerBadge';
import { t } from '../i18n';

interface SellerCardProps {
  seller: Seller;
}

export function SellerCard({ seller }: SellerCardProps) {
  const navigate = useStore((s) => s.navigate);
  const language = useStore((s) => s.language);
  const { average, count } = getSellerRatingSummary(seller.id);

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.98] ${seller.isVerified ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'
        }`}
      onClick={() => navigate('seller', { sellerId: seller.id })}
    >
      {/* Cover */}
      <div className="relative h-20 overflow-hidden">
        <img
          src={seller.coverImage}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Verified badge on cover */}
        {seller.isVerified && (
          <div className="absolute top-2 right-2">
            <SellerBadge isVerified={true} size="sm" />
          </div>
        )}
      </div>

      {/* Avatar & Info */}
      <div className="relative px-3 pb-3">
        <div className="flex items-end gap-2 -mt-5">
          <img
            src={seller.avatar}
            alt={seller.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
          />
          <div className="flex-1 pt-2 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {language === 'ar' ? seller.nameAr : seller.name}
              </h3>
              {seller.isVerified && (
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">{seller.bio}</p>

        {/* Delivery info - NEW */}
        <div className="flex items-center gap-1 mt-1.5">
          <Truck size={10} className="text-emerald-500" />
          <span className="text-[10px] text-emerald-600 font-medium">
            {seller.deliveryInfo || t('seller.deliveryToAllIraq')}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-gray-700">{average.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({count})</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-500">{language === 'ar' ? seller.locationAr : seller.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-500">{seller.productCount || seller.totalSales}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
