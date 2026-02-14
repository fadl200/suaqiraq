import { useState } from 'react';
import { ArrowLeft, Star, MapPin, ShieldCheck, Instagram, MessageCircle, Eye, ShoppingBag, Calendar, Share2 } from 'lucide-react';
import { getSellerById, getProductsBySeller, getRatingsBySeller, getSellerRatingSummary, formatPrice } from '../store/data';
import { useStore } from '../store/useStore';
import { ProductCard } from '../components/ProductCard';
import { useSeller } from '../contexts/SellerContext';

export function SellerPage() {
  const selectedSellerId = useStore((s) => s.selectedSellerId);
  const goBack = useStore((s) => s.goBack);
  const language = useStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const { isLoading } = useSeller();

  const seller = selectedSellerId ? getSellerById(selectedSellerId) : null;
  const sellerProducts = seller ? getProductsBySeller(seller.id) : [];
  const sellerRatings = seller ? getRatingsBySeller(seller.id) : [];
  const featuredProduct = seller?.featuredProductId
    ? sellerProducts.find(p => p.id === seller.featuredProductId)
    : undefined;

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{isLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : 'Seller not found'}</p>
      </div>
    );
  }

  const avgPrice = sellerProducts.length > 0
    ? sellerProducts.reduce((sum, p) => sum + p.price, 0) / sellerProducts.length
    : 0;
  const { average: avgRating, count: ratingCount } = getSellerRatingSummary(seller.id);
  const shareUrl = (() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    url.searchParams.set('page', 'seller');
    url.searchParams.set('sellerId', seller.id);
    return url.toString();
  })();

  const onShare = async () => {
    const title = language === 'ar' ? seller.nameAr : seller.name;
    const text = language === 'ar' ? `شوف صفحة هذا البائع: ${title}` : `Check this seller: ${title}`;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
          title,
          text,
          url: shareUrl,
        });
        return;
      }
    } catch {
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert(language === 'ar' ? 'تم نسخ رابط صفحة البائع' : 'Seller link copied');
    } catch {
      window.prompt(language === 'ar' ? 'انسخ الرابط:' : 'Copy link:', shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-12 pb-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <button
          onClick={goBack}
          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-sm font-semibold text-gray-900 truncate mx-4">{seller.name}</h1>
        <button onClick={onShare} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Share2 size={20} className="text-gray-700" />
        </button>
      </div>

      <div className="pt-24 animate-fade-in">
        {/* Cover + Avatar */}
        <div className="relative mx-4">
          <div className="h-32 rounded-2xl overflow-hidden">
            <img src={seller.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
          </div>
          <div className="absolute -bottom-8 left-4 flex items-end gap-3">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-18 h-18 rounded-2xl object-cover border-4 border-white shadow-lg"
              style={{ width: '72px', height: '72px' }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="mx-4 mt-12 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-gray-900">{seller.name}</h2>
                {seller.isVerified && (
                  <ShieldCheck size={18} className="text-emerald-500" />
                )}
              </div>
              <p className="text-sm text-gray-500">{seller.nameAr}</p>
            </div>
            {seller.isVerified && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={10} /> Verified
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{seller.bio}</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <Star size={16} className="text-amber-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">Rating ({ratingCount})</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <ShoppingBag size={16} className="text-emerald-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-gray-900">{seller.totalSales}</p>
              <p className="text-[10px] text-gray-500">Sales</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <Eye size={16} className="text-blue-500 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-gray-900">{(seller.viewCount / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-gray-500">Views</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <MapPin size={16} className="text-red-400 mx-auto mb-0.5" />
              <p className="text-sm font-bold text-gray-900">{seller.locationAr}</p>
              <p className="text-[10px] text-gray-500">Location</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2 mt-4">
            <a
              href={`https://wa.me/${seller.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
            {seller.isVerified && seller.instagram && (
              <a
                href={`https://instagram.com/${seller.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Instagram size={14} />
                Instagram
              </a>
            )}
            {seller.isVerified && seller.tiktok && (
              <a
                href={`https://tiktok.com/@${seller.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                <span className="text-sm">♪</span>
                TikTok
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-gray-400">
            <Calendar size={12} />
            <span className="text-[11px]">Joined {new Date(seller.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {seller.isVerified && featuredProduct && (
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'ar' ? 'المنتج المميز' : 'Featured Product'}
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-full">
                  {language === 'ar' ? 'للموثقين فقط' : 'Verified only'}
                </span>
              </div>
              <ProductCard product={featuredProduct} compact={false} trackViews={false} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'text-emerald-600 border-b-2 border-emerald-500'
                  : 'text-gray-500'
              }`}
            >
              Products ({sellerProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'text-emerald-600 border-b-2 border-emerald-500'
                  : 'text-gray-500'
              }`}
            >
              Reviews ({sellerRatings.length})
            </button>
          </div>

          <div className="p-3">
            {activeTab === 'products' ? (
              sellerProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {sellerProducts.map(product => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-3xl">📦</span>
                  <p className="text-sm text-gray-500 mt-2">No products yet</p>
                </div>
              )
            ) : (
              sellerRatings.length > 0 ? (
                <div className="space-y-3">
                  {/* Rating Summary */}
                  <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-700">{avgRating.toFixed(1)}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= Math.round(avgRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-0.5">{ratingCount} reviews</p>
                    </div>
                    <div className="flex-1 text-[11px] text-emerald-700">
                      <p>Avg. product price: {formatPrice(Math.round(avgPrice))}</p>
                      <p className="mt-0.5">Total sales: {seller.totalSales}+</p>
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  {sellerRatings.map(review => (
                    <div key={review.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                            {review.buyerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{review.buyerName}</p>
                            <p className="text-[10px] text-gray-400">{review.date}</p>
                          </div>
                        </div>
                        {review.verified && (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <ShieldCheck size={9} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={11}
                            className={star <= review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-3xl">⭐</span>
                  <p className="text-sm text-gray-500 mt-2">No reviews yet</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
