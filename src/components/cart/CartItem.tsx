// CartItem Component - Display single cart item with quantity controls

import { useTranslation } from 'react-i18next';
import { Product, Seller, formatPrice } from '../../store/data';
import { useCart } from '../../contexts/CartContext';

interface CartItemProps {
    product: Product;
    seller: Seller;
    quantity: number;
}

export function CartItem({ product, seller, quantity }: CartItemProps) {
    const { t } = useTranslation();
    const { updateQuantity, removeFromCart } = useCart();

    const handleIncrement = () => {
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product.id, quantity - 1);
        } else {
            removeFromCart(product.id);
        }
    };

    const handleRemove = () => {
        removeFromCart(product.id);
    };

    const itemTotal = product.price * quantity;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3">
            <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0">
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {seller.name}
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatPrice(product.price)}
                    </p>
                </div>

                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label={t('removeFromCart')}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Quantity Controls and Total */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDecrement}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                        {quantity}
                    </span>
                    <button
                        onClick={handleIncrement}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Item Total */}
                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('cart.total')}</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                        {formatPrice(itemTotal)}
                    </p>
                </div>
            </div>
        </div>
    );
}
