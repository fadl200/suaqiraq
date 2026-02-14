import { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { getProductById } from '../store/data';
import { useStore } from '../store/useStore';
import { ProductCard } from '../components/ProductCard';

export function FavoritesPage() {
  const favorites = useStore((s) => s.favorites);
  const navigate = useStore((s) => s.navigate);
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  useEffect(() => {
    const raw = sessionStorage.getItem('iraq_marketplace_pending_action');
    if (!raw) return;
    try {
      const action = JSON.parse(raw) as { type?: unknown; productId?: unknown };
      if (action.type === 'favorite' && typeof action.productId === 'string') {
        toggleFavorite(action.productId);
      }
    } finally {
      sessionStorage.removeItem('iraq_marketplace_pending_action');
    }
  }, [toggleFavorite]);

  const favProducts = favorites
    .map(id => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-red-500" />
          <h1 className="text-lg font-bold text-gray-900">Saved Items</h1>
          {favProducts.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
              {favProducts.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 animate-fade-in">
        {favProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {favProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-red-300" />
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-1">No saved items yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-[240px] mx-auto">
              Tap the heart icon on any product to save it here for later
            </p>
            <button
              onClick={() => navigate('search')}
              className="bg-emerald-500 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
