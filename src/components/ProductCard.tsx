import { useCallback } from 'react';
import { Heart, Eye, ShoppingBag, Truck, CheckCircle } from 'lucide-react';
import { type Product, getSellerById, formatPrice } from '../store/data';
import { useStore } from '../store/useStore';
import { useCart } from '../contexts/CartContext';
import { LazyImage } from './LazyImage';
import { ProductViewTracker } from './views/ProductViewTracker';
import { formatViewCount } from '../services/viewsService';
import { t } from '../i18n';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  /** Whether to track views when product is visible */
  trackViews?: boolean;
}

export function ProductCard({ product, compact = false, trackViews = true }: ProductCardProps) {
  const navigate = useStore((s) => s.navigate);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const setAuthNextPage = useStore((s) => s.setAuthNextPage);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setViewCount = useStore((s) => s.setViewCount);
  const language = useStore((s) => s.language);
  const isFav = useStore((s) => s.favorites.includes(product.id));
  const viewCountFromStore = useStore((s) => s.viewCounts[product.id]);
  const { addToCart } = useCart();
  const seller = getSellerById(product.sellerId);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Get current view count (from store or product data)
  const currentViewCount = viewCountFromStore ?? product.viewCount;

  // Handle view tracked callback
  const handleViewTracked = useCallback((productId: string, newCount: number) => {
    setViewCount(productId, newCount);
  }, [setViewCount]);

  const openProduct = useCallback(() => {
    navigate('product', { productId: product.id });
  }, [navigate, product.id]);

  const handleAddToCart = (productId: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('iraq_marketplace_pending_action', JSON.stringify({ type: 'add_to_cart', productId, quantity: 1 }));
      setAuthNextPage('cart');
      navigate('profile');
      return;
    }
    addToCart(productId, 1);
    navigate('cart');
  };

  const handleToggleFavorite = (productId: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('iraq_marketplace_pending_action', JSON.stringify({ type: 'favorite', productId }));
      setAuthNextPage('favorites');
      navigate('profile');
      return;
    }
    toggleFavorite(productId);
  };

  // If tracking is disabled, render without tracker
  if (!trackViews) {
    return (
          <ProductCardContent
            product={product}
            compact={compact}
            isFav={isFav}
            discount={discount}
            seller={seller}
            language={language}
            currentViewCount={currentViewCount}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onOpenProduct={openProduct}
          />
    );
  }

  // Render with view tracking
  return (
    <ProductViewTracker
      productId={product.id}
      initialViewCount={product.viewCount}
      onViewTracked={handleViewTracked}
      threshold={0.3}
      minVisibleTime={500}
    >
      {({ ref, viewCount }) => (
        <div ref={ref}>
          <ProductCardContent
            product={product}
            compact={compact}
            isFav={isFav}
            discount={discount}
            seller={seller}
            language={language}
            currentViewCount={viewCount || currentViewCount}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onOpenProduct={openProduct}
          />
        </div>
      )}
    </ProductViewTracker>
  );
}

// Separated content component to avoid duplication
interface ProductCardContentProps {
  product: Product;
  compact: boolean;
  isFav: boolean;
  discount: number;
  seller: ReturnType<typeof getSellerById>;
  language: 'en' | 'ar';
  currentViewCount: number;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onOpenProduct: () => void;
}

function ProductCardContent({
  product,
  compact,
  isFav,
  discount,
  seller,
  language,
  currentViewCount,
  onToggleFavorite,
  onAddToCart,
  onOpenProduct,
}: ProductCardContentProps) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group cursor-pointer ${compact ? '' : ''
        }`}
      onClick={onOpenProduct}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <LazyImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Verification Badge - Show first for verified products */}
          {product.isVerified && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <CheckCircle size={10} />
              {t('verification.verified')}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Heart
            size={16}
            className={`transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
          />
        </button>

        {/* Views */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          <Eye size={10} className="text-white/80" />
          <span className="text-[10px] text-white/90 font-medium">
            {formatViewCount(currentViewCount, language)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
          {product.name}
        </h3>

        {!compact && seller && (
          <div className="flex items-center gap-1.5 mb-1">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="text-[11px] text-gray-500 truncate">{seller.name}</span>
            {seller.isVerified && (
              <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}

        {/* Delivery info - NEW */}
        {!compact && seller && (
          <div className="flex items-center gap-1 mb-2">
            <Truck size={10} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-medium">
              {seller.deliveryInfo || t('seller.deliveryToAllIraq')}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <span className="text-base font-bold text-emerald-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="block text-[11px] text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            disabled={!product.inStock}
            title={t('common.addToCart')}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${product.inStock
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
