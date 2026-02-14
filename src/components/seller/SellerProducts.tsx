/**
 * SellerProducts Component
 * Displays a seller's products grid with:
 * - Product count
 * - Edit/delete options for seller
 * - Product cards
 */

import { Edit2, Trash2, Plus, Package, Eye } from 'lucide-react';
import { type Product, type Seller, formatPrice } from '../../store/data';
import { useStore } from '../../store/useStore';
import { ProductCard } from '../ProductCard';

interface SellerProductsProps {
    seller: Seller;
    products: Product[];
    isOwner?: boolean;
    onAddProduct?: () => void;
    onEditProduct?: (product: Product) => void;
    onDeleteProduct?: (product: Product) => void;
    className?: string;
}

export function SellerProducts({
    products,
    isOwner = false,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
    className = '',
}: SellerProductsProps) {
    const language = useStore((s) => s.language);

    // Calculate total views
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Package size={18} className="text-emerald-600" />
                        {language === 'ar' ? 'منتجاتي' : 'My Products'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{products.length} {language === 'ar' ? 'منتج' : 'products'}</span>
                        <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {totalViews.toLocaleString()} {language === 'ar' ? 'مشاهدة' : 'views'}
                        </span>
                    </div>
                </div>

                {isOwner && onAddProduct && (
                    <button
                        onClick={onAddProduct}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                        <Plus size={16} />
                        <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                    </button>
                )}
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((product) => (
                        <div key={product.id} className="relative group">
                            <ProductCard product={product} />

                            {/* Owner Actions Overlay */}
                            {isOwner && (onEditProduct || onDeleteProduct) && (
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEditProduct && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditProduct(product);
                                            }}
                                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                                        >
                                            <Edit2 size={14} className="text-gray-600" />
                                        </button>
                                    )}
                                    {onDeleteProduct && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProduct(product);
                                            }}
                                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={14} className="text-red-500" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="text-gray-900 font-semibold mb-1">
                        {language === 'ar' ? 'لا توجد منتجات' : 'No products yet'}
                    </h4>
                    <p className="text-gray-500 text-sm mb-4">
                        {language === 'ar'
                            ? 'ابدأ بإضافة منتجاتك الأولى'
                            : 'Start by adding your first product'}
                    </p>
                    {isOwner && onAddProduct && (
                        <button
                            onClick={onAddProduct}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                        >
                            <Plus size={16} />
                            <span>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Compact product list for seller dashboard
 */
export function SellerProductsList({
    products,
    isOwner = false,
    onEditProduct,
    onDeleteProduct,
    className = '',
}: {
    products: Product[];
    isOwner?: boolean;
    onEditProduct?: (product: Product) => void;
    onDeleteProduct?: (product: Product) => void;
    className?: string;
}) {
    const language = useStore((s) => s.language);

    return (
        <div className={`space-y-2 ${className}`}>
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                >
                    {/* Product Image */}
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                            {language === 'ar' ? product.nameAr : product.name}
                        </h4>
                        <p className="text-emerald-600 font-semibold text-sm">
                            {formatPrice(product.price)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                                <Eye size={10} />
                                {product.viewCount}
                            </span>
                            <span className={product.inStock ? 'text-emerald-600' : 'text-red-500'}>
                                {product.inStock
                                    ? (language === 'ar' ? 'متوفر' : 'In Stock')
                                    : (language === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    {isOwner && (onEditProduct || onDeleteProduct) && (
                        <div className="flex gap-1">
                            {onEditProduct && (
                                <button
                                    onClick={() => onEditProduct(product)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                    <Edit2 size={14} className="text-gray-500" />
                                </button>
                            )}
                            {onDeleteProduct && (
                                <button
                                    onClick={() => onDeleteProduct(product)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={14} className="text-red-500" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default SellerProducts;
