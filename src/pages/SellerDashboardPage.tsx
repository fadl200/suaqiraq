/**
 * SellerDashboardPage
 * Seller's personal dashboard with:
 * - View their products
 * - Add new products (simplified form)
 * - View statistics (views, products count)
 * - Only accessible by seller
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Package, TrendingUp, Settings, Truck, Star, Instagram, Music2, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSeller } from '../contexts/SellerContext';
import { getProductsBySeller, getSellerRatingSummary, type Seller, type Product } from '../store/data';
import { SellerBadge } from '../components/seller/SellerBadge';
import { AddProductForm } from '../components/seller/AddProductForm';
import { SellerProducts } from '../components/seller/SellerProducts';
import { t } from '../i18n';

export function SellerDashboardPage() {
    const language = useStore((s) => s.language);
    const navigate = useStore((s) => s.navigate);
    const selectedSellerId = useStore((s) => s.selectedSellerId);
    const { fetchSellerById, fetchSellerStats, updateSocialLinks, updateFeaturedProduct, isLoading, error, clearError } = useSeller();

    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'stats' | 'settings'>('products');
    const [instagram, setInstagram] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [featuredProductId, setFeaturedProductId] = useState('');
    const [saved, setSaved] = useState(false);

    // Load seller data
    useEffect(() => {
        // In a real app, this would come from auth context
        // For demo, we use the selected seller ID or default to first seller
        const sellerId = selectedSellerId || 's1';
        const foundSeller = fetchSellerById(sellerId);

        if (foundSeller) {
            setSeller(foundSeller);
            setProducts(getProductsBySeller(sellerId));
            fetchSellerStats(sellerId);
            setInstagram(foundSeller.instagram || '');
            setTiktok(foundSeller.tiktok || '');
            setFeaturedProductId(foundSeller.featuredProductId || '');
            setSaved(false);
        }
    }, [selectedSellerId, fetchSellerById, fetchSellerStats]);

    if (!seller) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }

    // Calculate stats
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.inStock).length;
    const { average: avgRating, count: ratingCount } = getSellerRatingSummary(seller.id);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-4 pt-12 pb-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('home')}
                        className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-4"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>

                    {/* Seller Info */}
                    <div className="flex items-center gap-3">
                        <img
                            src={seller.avatar}
                            alt={seller.name}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-white text-lg font-bold">
                                    {language === 'ar' ? seller.nameAr : seller.name}
                                </h1>
                                {seller.isVerified && <SellerBadge isVerified={true} size="sm" />}
                            </div>
                            <p className="text-emerald-100 text-sm">
                                {language === 'ar' ? 'لوحة تحكم البائع' : 'Seller Dashboard'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-4 -mt-4 relative z-20">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package size={14} className="text-blue-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
                        <p className="text-[10px] text-gray-500">
                            {language === 'ar' ? 'منتج' : 'Products'}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Eye size={14} className="text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">
                            {language === 'ar' ? 'مشاهدة' : 'Views'}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Star size={14} className="text-amber-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                        <p className="text-[10px] text-gray-500">
                            {language === 'ar' ? `التقييم (${ratingCount})` : `Rating (${ratingCount})`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Delivery Info Banner */}
            <div className="px-4 mt-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800">
                            {seller.deliveryInfo || t('seller.deliveryToAllIraq')}
                        </p>
                        <p className="text-xs text-emerald-600">
                            {language === 'ar'
                                ? 'يظهر في جميع منتجاتك'
                                : 'Shows on all your products'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 mt-4">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                    >
                        {language === 'ar' ? 'منتجاتي' : 'My Products'}
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                    >
                        {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}
                    >
                        {language === 'ar' ? 'الإعدادات' : 'Settings'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 mt-4">
                {activeTab === 'products' ? (
                    showAddForm ? (
                        <AddProductForm
                            seller={seller}
                            onProductAdded={() => {
                                setShowAddForm(false);
                                // Refresh products
                                setProducts(getProductsBySeller(seller.id));
                            }}
                            onCancel={() => setShowAddForm(false)}
                        />
                    ) : (
                        <SellerProducts
                            seller={seller}
                            products={products}
                            isOwner={true}
                            onAddProduct={() => setShowAddForm(true)}
                        />
                    )
                ) : activeTab === 'stats' ? (
                    <div className="space-y-4">
                        {/* Stats Overview */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-600" />
                                {language === 'ar' ? 'نظرة عامة' : 'Overview'}
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">{totalProducts}</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'المنتجات المتوفرة' : 'In Stock'}
                                    </span>
                                    <span className="text-sm font-semibold text-emerald-600">{inStockProducts}</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'المنتجات غير المتوفرة' : 'Out of Stock'}
                                    </span>
                                    <span className="text-sm font-semibold text-red-500">{totalProducts - inStockProducts}</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">{totalViews.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">{seller.totalSales}</span>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-600">
                                        {language === 'ar' ? 'التقييم' : 'Rating'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-500">({ratingCount})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-3">
                                {language === 'ar' ? 'حالة التحقق' : 'Verification Status'}
                            </h3>

                            {seller.isVerified ? (
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                    <SellerBadge isVerified={true} size="md" showLabel={false} />
                                    <div>
                                        <p className="text-sm font-medium text-emerald-800">
                                            {t('seller.verified')}
                                        </p>
                                        <p className="text-xs text-emerald-600">
                                            {language === 'ar'
                                                ? 'منتجاتك تظهر أولاً في البحث'
                                                : 'Your products appear first in search'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Settings size={16} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">
                                            {language === 'ar' ? 'حساب غير موثق' : 'Unverified Account'}
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            {language === 'ar'
                                                ? 'توثيق حسابك للحصول على ميزات إضافية'
                                                : 'Verify your account for extra features'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Settings size={18} className="text-emerald-600" />
                                {language === 'ar' ? 'مزايا التوثيق' : 'Verification Benefits'}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Instagram size={16} className="text-purple-500" />
                                    <span>{language === 'ar' ? 'إضافة انستا وتيك توك للمتجر' : 'Add Instagram & TikTok links'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star size={16} className="text-amber-500" />
                                    <span>{language === 'ar' ? 'اختيار منتج مميز يظهر أعلى صفحة متجرك' : 'Pick a featured product shown on your seller page'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-3">
                                {language === 'ar' ? 'روابط السوشيال' : 'Social Links'}
                            </h3>

                            {!seller.isVerified ? (
                                <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                                    {language === 'ar'
                                        ? 'هذه الميزة متاحة فقط للبائعين الموثقين.'
                                        : 'This feature is available for verified sellers only.'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                            {language === 'ar' ? 'انستغرام (بدون @)' : 'Instagram (no @)'}
                                        </label>
                                        <input
                                            value={instagram}
                                            onChange={(e) => {
                                                setInstagram(e.target.value);
                                                setSaved(false);
                                                if (error) clearError();
                                            }}
                                            placeholder={language === 'ar' ? 'مثال: noorfashion_iq' : 'e.g. noorfashion_iq'}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                            {language === 'ar' ? 'تيك توك (بدون @)' : 'TikTok (no @)'}
                                        </label>
                                        <input
                                            value={tiktok}
                                            onChange={(e) => {
                                                setTiktok(e.target.value);
                                                setSaved(false);
                                                if (error) clearError();
                                            }}
                                            placeholder={language === 'ar' ? 'مثال: noorfashion' : 'e.g. noorfashion'}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                            {language === 'ar' ? 'المنتج المميز' : 'Featured Product'}
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={featuredProductId}
                                                onChange={(e) => {
                                                    setFeaturedProductId(e.target.value);
                                                    setSaved(false);
                                                    if (error) clearError();
                                                }}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                                            >
                                                <option value="">
                                                    {language === 'ar' ? 'بدون' : 'None'}
                                                </option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {language === 'ar' ? p.nameAr : p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                                                <Music2 size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={async () => {
                                            setSaved(false);
                                            clearError();
                                            try {
                                                const updatedAfterLinks = await updateSocialLinks(seller.id, { instagram, tiktok });
                                                const updatedAfterFeatured = await updateFeaturedProduct(seller.id, featuredProductId ? featuredProductId : null);
                                                setSeller(updatedAfterFeatured);
                                                setInstagram(updatedAfterLinks.instagram || '');
                                                setTiktok(updatedAfterLinks.tiktok || '');
                                                setFeaturedProductId(updatedAfterFeatured.featuredProductId || '');
                                                setSaved(true);
                                            } catch {
                                            }
                                        }}
                                        className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        {language === 'ar' ? 'حفظ' : 'Save'}
                                    </button>

                                    {saved && !error && (
                                        <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-800">
                                            {language === 'ar' ? 'تم الحفظ.' : 'Saved.'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SellerDashboardPage;
