// AddToCartButton Component - Button to add product to cart with success feedback

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../store/data';
import { useCart } from '../../contexts/CartContext';
import { ScreenshotWarning } from './ScreenshotWarning';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type AppState } from '../../store/useStore';

interface AddToCartButtonProps {
    product: Product;
    showWarning?: boolean;
    className?: string;
}

export function AddToCartButton({ product, showWarning = true, className = '' }: AddToCartButtonProps) {
    const { t } = useTranslation();
    const { addToCart, isInCart, getQuantity, updateQuantity } = useCart();
    const { isAuthenticated, navigate, setAuthNextPage } = useStore(useShallow((state: AppState) => ({
        isAuthenticated: state.isAuthenticated,
        navigate: state.navigate,
        setAuthNextPage: state.setAuthNextPage,
    })));
    const [showSuccess, setShowSuccess] = useState(false);

    const inCart = isInCart(product.id);
    const quantity = getQuantity(product.id);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            sessionStorage.setItem(
                'iraq_marketplace_pending_action',
                JSON.stringify({ type: 'add_to_cart', productId: product.id, quantity: 1 })
            );
            setAuthNextPage('cart');
            navigate('profile');
            return;
        }
        addToCart(product.id, 1);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleIncrement = () => {
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product.id, quantity - 1);
        }
    };

    if (!product.inStock) {
        return (
            <div className={className}>
                {showWarning && <ScreenshotWarning />}
                <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed"
                >
                    {t('outOfStock')}
                </button>
            </div>
        );
    }

    return (
        <div className={className}>
            {showWarning && <ScreenshotWarning />}

            {inCart ? (
                // Quantity Controls when item is in cart
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDecrement}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="flex-1 text-center font-semibold text-gray-900 dark:text-white">
                        {quantity} {t('inCart')}
                    </span>
                    <button
                        onClick={handleIncrement}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            ) : (
                // Add to Cart Button
                <button
                    onClick={handleAddToCart}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${showSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                >
                    {showSuccess ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('addedToCart')}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {t('addToCart')}
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
