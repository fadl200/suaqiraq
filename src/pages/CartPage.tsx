// CartPage - Display all cart items grouped by seller with checkout functionality

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { ScreenshotWarning } from '../components/cart/ScreenshotWarning';
import { formatPrice } from '../store/data';
import { processCheckout } from '../services/cartService';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type AppState } from '../store/useStore';

export function CartPage() {
    const { t } = useTranslation();
    const { sellerGroups, total, itemCount, clearCart, isLoading, addToCart } = useCart();
    const { language, navigate } = useStore(useShallow((state: AppState) => ({
        language: state.language,
        navigate: state.navigate,
    })));
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem('iraq_marketplace_pending_action');
        if (!raw) return;
        try {
            const action = JSON.parse(raw) as { type?: unknown; productId?: unknown; quantity?: unknown };
            if (action.type === 'add_to_cart' && typeof action.productId === 'string') {
                const qty = typeof action.quantity === 'number' && Number.isFinite(action.quantity) ? action.quantity : 1;
                addToCart(action.productId, qty);
            }
        } finally {
            sessionStorage.removeItem('iraq_marketplace_pending_action');
        }
    }, [addToCart]);

    const handleCheckout = () => {
        if (sellerGroups.length === 0) return;
        setShowConfirmation(true);
    };

    const handleConfirmCheckout = () => {
        setShowConfirmation(false);
        setIsProcessing(true);

        const { openNextSeller } = processCheckout(language);

        // Open first seller
        openNextSeller();

        // For simplicity, we'll open all sellers at once
        // In a real app, you might want to show a modal between each seller
        setIsProcessing(false);
        clearCart();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (sellerGroups.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-lg mx-auto">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('cart.title')}
                        </h1>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {t('cart.emptyCart')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t('cart.emptyCartMessage')}
                        </p>
                        <button
                            onClick={() => navigate('home')}
                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                        >
                            {t('cart.continueShopping')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-lg mx-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('cart.title')}
                    </h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {itemCount} {t('cart.items')}
                    </span>
                </div>

                {/* Screenshot Warning */}
                <ScreenshotWarning />

                {/* Cart Items by Seller */}
                {sellerGroups.map((group) => (
                    <div key={group.seller.id} className="mb-6">
                        {/* Seller Header */}
                        <div className="flex items-center gap-3 mb-3 px-1">
                            <img
                                src={group.seller.avatar}
                                alt={group.seller.name}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {group.seller.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {group.items.length} {t('cart.items')}
                                </p>
                            </div>
                        </div>

                        {/* Items */}
                        {group.items.map((item) => (
                            <CartItem
                                key={item.product.id}
                                product={item.product}
                                seller={group.seller}
                                quantity={item.quantity}
                            />
                        ))}
                    </div>
                ))}

                {/* Order Summary */}
                <CartSummary sellerGroups={sellerGroups} grandTotal={total} />

                {/* Checkout Button */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing || itemCount === 0}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {t('cart.completeOrder')} - {formatPrice(total)}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t('cart.confirmOrder')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {t('cart.confirmOrderMessage', { count: sellerGroups.length })}
                        </p>

                        {/* Summary */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            {sellerGroups.map((group) => (
                                <div key={group.seller.id} className="flex justify-between text-sm mb-2 last:mb-0">
                                    <span className="text-gray-600 dark:text-gray-300">{group.seller.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatPrice(group.total)}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 flex justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">{t('cart.total')}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmCheckout}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
