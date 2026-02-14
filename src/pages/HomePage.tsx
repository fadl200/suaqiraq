import { Search, Bell, TrendingUp, ChevronRight, Sparkles, Flame, Zap } from 'lucide-react';
import { categories, getSellerRatingSummary } from '../store/data';
import { useStore } from '../store/useStore';
import { ProductCard } from '../components/ProductCard';
import { SellerCard } from '../components/SellerCard';
import { sortProductsByVerification } from '../services/sellerService';
import { useSeller } from '../contexts/SellerContext';

export function HomePage() {
  const navigate = useStore((s) => s.navigate);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const { products, sellers } = useSeller();

  // Sort products: verified sellers' products first, then by view count
  const trendingProducts = sortProductsByVerification(
    [...products].sort((a, b) => b.viewCount - a.viewCount)
  ).slice(0, 6);

  const discountProducts = sortProductsByVerification(
    products.filter(p => p.originalPrice)
  );

  // Sort sellers: verified sellers first, then by rating
  const topSellers = [...sellers].sort((a, b) => {
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return getSellerRatingSummary(b.id).average - getSellerRatingSummary(a.id).average;
  }).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-12 pb-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-xl font-bold flex items-center gap-1">
                🇮🇶 Souq Iraq
              </h1>
              <p className="text-emerald-100 text-xs mt-0.5">Smart Marketplace</p>
            </div>
            <button className="relative w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bell size={20} className="text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <button
            onClick={() => navigate('search')}
            className="w-full bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-emerald-800/10"
          >
            <Search size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">Search products, sellers...</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 -mt-1 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="grid grid-cols-4 gap-2">
            {categories.slice(1).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  navigate('search');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[10px] font-medium text-gray-600">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 mb-5">
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1">
              <Zap size={14} className="text-white" />
              <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider">Zero Commission</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">
              Sell for Free!<br />Keep 100% Profit
            </h3>
            <p className="text-white/80 text-xs mt-1">Join 500+ Iraqi sellers today</p>
            <button
              onClick={() => navigate('profile')}
              className="mt-3 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors active:scale-95"
            >
              Start Selling →
            </button>
          </div>
        </div>
      </div>

      {/* Hot Deals */}
      {discountProducts.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <Flame size={14} className="text-red-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Hot Deals</h2>
            </div>
            <button
              onClick={() => navigate('search')}
              className="flex items-center gap-0.5 text-xs font-medium text-emerald-600"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {discountProducts.map((product) => (
              <div key={product.id} className="min-w-[160px] max-w-[160px]">
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Sellers */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Top Sellers</h2>
          </div>
          <button
            onClick={() => navigate('search')}
            className="flex items-center gap-0.5 text-xs font-medium text-emerald-600"
          >
            See All <ChevronRight size={14} />
          </button>
        </div>
        <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topSellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Trending Now</h2>
          </div>
        </div>
        <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
