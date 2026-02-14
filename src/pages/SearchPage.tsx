import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, MapPin, ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { getSellerRatingSummary, categories, locations } from '../store/data';
import { useStore } from '../store/useStore';
import { ProductCard } from '../components/ProductCard';
import { SellerCard } from '../components/SellerCard';
import { sortProductsByVerification } from '../services/sellerService';
import { sortProductsByVerificationStatus } from '../services/verificationService';
import { useSeller } from '../contexts/SellerContext';

type Tab = 'products' | 'sellers';

export function SearchPage() {
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedLocation, setSelectedLocation } = useStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
      selectedCategory: state.selectedCategory,
      setSelectedCategory: state.setSelectedCategory,
      selectedLocation: state.selectedLocation,
      setSelectedLocation: state.setSelectedLocation,
    })),
  );
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('popular');
  const { products, sellers } = useSeller();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedLocation !== 'all') {
      const sellerIds = sellers.filter(s => s.location === selectedLocation).map(s => s.id);
      result = result.filter(p => sellerIds.includes(p.sellerId));
    }

    // Sort by selected option
    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'popular': result.sort((a, b) => b.viewCount - a.viewCount); break;
    }

    // NEW: Sort by verified sellers - verified sellers' products appear first
    result = sortProductsByVerification(result);

    // NEW: Sort by product verification status - verified products appear first
    // Ratings do NOT affect sorting - only verification status matters
    result = sortProductsByVerificationStatus(result);

    return result;
  }, [products, sellers, searchQuery, selectedCategory, selectedLocation, sortBy]);

  const filteredSellers = useMemo(() => {
    let result = [...sellers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.bio.toLowerCase().includes(q)
      );
    }

    if (selectedLocation !== 'all') {
      result = result.filter(s => s.location === selectedLocation);
    }

    // NEW: Sort sellers - verified sellers first
    result.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return getSellerRatingSummary(b.id).average - getSellerRatingSummary(a.id).average;
    });

    return result;
  }, [sellers, searchQuery, selectedLocation]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 pt-12 pb-3">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, sellers..."
                className="w-full bg-gray-100 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white border border-transparent focus:border-emerald-200 transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-transparent text-gray-500'
                }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
            >
              Products ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'sellers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
            >
              Sellers ({filteredSellers.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-3 animate-slide-up border-t border-gray-50">
            {/* Location */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin size={11} /> Location
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedLocation === loc.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            {activeTab === 'products' && (
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ChevronDown size={11} /> Sort by
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'popular' as const, label: '🔥 Popular' },
                    { id: 'newest' as const, label: '✨ Newest' },
                    { id: 'price-low' as const, label: '💰 Price: Low' },
                    { id: 'price-high' as const, label: '💎 Price: High' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortBy === s.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Pills */}
      {activeTab === 'products' && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200'
                }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="px-4 pb-4">
        {activeTab === 'products' ? (
          filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🔍</span>
              <h3 className="text-gray-900 font-semibold mb-1">No products found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )
        ) : (
          filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSellers.map(seller => (
                <SellerCard key={seller.id} seller={seller} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🏪</span>
              <h3 className="text-gray-900 font-semibold mb-1">No sellers found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
