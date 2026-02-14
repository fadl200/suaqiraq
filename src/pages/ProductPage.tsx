import { ArrowLeft, Heart, Share2, Star, MapPin, ShieldCheck, Eye, MessageCircle, ExternalLink } from 'lucide-react';
import { getProductById, getSellerById, getProductsBySeller, formatPrice, generateWhatsAppLink } from '../store/data';
import { useStore } from '../store/useStore';
import { ProductCard } from '../components/ProductCard';
import { LazyImage } from '../components/LazyImage';
import { ScreenshotWarning } from '../components/cart/ScreenshotWarning';
import { AddToCartButton } from '../components/cart/AddToCartButton';
import { useEffect, useState } from 'react';
import { trackProductView, formatViewCount } from '../services/viewsService';
import { useTranslation } from 'react-i18next';
import { VerificationStatusDisplay, InlineVerificationStatus } from '../components/verification/VerificationStatus';
import { RequestVerification } from '../components/verification/RequestVerification';
import { useSeller } from '../contexts/SellerContext';

export function ProductPage() {
  const { t } = useTranslation();
  const selectedProductId = useStore((s) => s.selectedProductId);
  const navigate = useStore((s) => s.navigate);
  const goBack = useStore((s) => s.goBack);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setViewCount = useStore((s) => s.setViewCount);
  const language = useStore((s) => s.language);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const setAuthNextPage = useStore((s) => s.setAuthNextPage);
  const isFav = useStore((s) => (selectedProductId ? s.favorites.includes(selectedProductId) : false));
  const viewCountFromStore = useStore((s) => (selectedProductId ? s.viewCounts[selectedProductId] : undefined));
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const { isLoading } = useSeller();

  const product = selectedProductId ? getProductById(selectedProductId) : null;
  const seller = product ? getSellerById(product.sellerId) : null;
  const relatedProducts = seller ? getProductsBySeller(seller.id).filter(p => p.id !== product?.id).slice(0, 4) : [];

  // Track view when product page is opened
  useEffect(() => {
    if (product && !hasTrackedView) {
      const result = trackProductView(product.id);
      if (result.recorded) {
        setViewCount(product.id, result.viewCount);
      }
      setHasTrackedView(true);
    }
  }, [product, hasTrackedView, setViewCount]);

  // Reset tracking when product changes
  useEffect(() => {
    setHasTrackedView(false);
  }, [selectedProductId]);

  if (!product || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{isLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : 'Product not found'}</p>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Get current view count (from store or product data)
  const currentViewCount = viewCountFromStore ?? product.viewCount;

  const whatsappLink = generateWhatsAppLink(seller.whatsapp, product.name);
  const shareUrl = (() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    url.searchParams.set('page', 'product');
    url.searchParams.set('productId', product.id);
    return url.toString();
  })();

  const onShare = async () => {
    const title = language === 'ar' ? product.nameAr : product.name;
    const text = language === 'ar' ? `شوف هذا المنتج: ${title}` : `Check this product: ${title}`;
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
      window.alert(language === 'ar' ? 'تم نسخ رابط المنتج' : 'Product link copied');
    } catch {
      window.prompt(language === 'ar' ? 'انسخ الرابط:' : 'Copy link:', shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-12 pb-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <button
          onClick={goBack}
          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-sm font-semibold text-gray-900 truncate mx-4 flex-1 text-center">
          Product Details
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                sessionStorage.setItem('iraq_marketplace_pending_action', JSON.stringify({ type: 'favorite', productId: product.id }));
                setAuthNextPage('favorites');
                navigate('profile');
                return;
              }
              toggleFavorite(product.id);
            }}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
          </button>
          <button
            onClick={onShare}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Share2 size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="pt-24 animate-fade-in">
        {/* Product Image */}
        <div className="relative aspect-square bg-white mx-4 rounded-2xl overflow-hidden shadow-sm">
          <LazyImage
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              -{discount}% OFF
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg">SOLD OUT</span>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Eye size={12} className="text-white/80" />
            <span className="text-xs text-white/90 font-medium">
              {formatViewCount(currentViewCount, language)} {language === 'ar' ? 'مشاهدة' : 'views'}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-1.5">{product.name}</h2>
              <h3 className="text-sm text-gray-500 font-medium">{product.nameAr}</h3>
            </div>
          </div>

          <div className="flex items-end gap-2 mt-3">
            <span className="text-2xl font-bold text-emerald-600">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through mb-0.5">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mt-3">{product.description}</p>
          <p className="text-sm text-gray-500 mt-1">{product.descriptionAr}</p>
        </div>

        {/* Product Verification Status */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">{t('verification.productVerification')}</h3>
            <InlineVerificationStatus status={product.verificationStatus} verifiedAt={product.verifiedAt} />
          </div>

          {/* Verification Status Display */}
          <VerificationStatusDisplay
            status={product.verificationStatus}
            verifiedAt={product.verifiedAt}
            size="sm"
          />

          {/* Request Verification Button (for sellers) */}
          {product.verificationStatus !== 'verified' && (
            <div className="mt-3">
              <RequestVerification
                productId={product.id}
                sellerId={product.sellerId}
                currentStatus={product.verificationStatus}
              />
            </div>
          )}
        </div>

        {/* Seller Info */}
        <div
          className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => navigate('seller', { sellerId: seller.id })}
        >
          <div className="flex items-center gap-3">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="text-sm font-bold text-gray-900">{seller.name}</h4>
                {seller.isVerified && (
                  <ShieldCheck size={16} className="text-emerald-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-gray-700">{seller.rating}</span>
                  <span className="text-[10px] text-gray-400">({seller.totalRatings})</span>
                </div>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-0.5">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{seller.locationAr}</span>
                </div>
              </div>
            </div>
            <ExternalLink size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-5">
            <h3 className="text-base font-bold text-gray-900 px-4 mb-3">More from this seller</h3>
            <div className="flex gap-3 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {relatedProducts.map(p => (
                <div key={p.id} className="min-w-[160px] max-w-[160px]">
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-bottom">
        <div className="max-w-lg mx-auto">
          {/* Screenshot Warning */}
          <ScreenshotWarning />

          <div className="flex gap-3">
            {/* Add to Cart Button */}
            <div className="flex-1">
              <AddToCartButton product={product} showWarning={false} />
            </div>

            {/* Buy via WhatsApp Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${product.inStock
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              onClick={(e) => !product.inStock && e.preventDefault()}
            >
              <MessageCircle size={18} />
              {product.inStock ? t('product.buyViaWhatsApp') : t('product.soldOut')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
