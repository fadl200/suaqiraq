// CartSummary Component - Display cart totals grouped by seller

import { useTranslation } from 'react-i18next';
import { SellerGroup } from '../../services/cartService';
import { formatPrice, locations } from '../../store/data';

interface CartSummaryProps {
    sellerGroups: SellerGroup[];
    grandTotal: number;
}

export function CartSummary({ sellerGroups, grandTotal }: CartSummaryProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t('cart.orderSummary')}
            </h3>

            {/* Seller Groups */}
            {sellerGroups.map((group) => {
                const locationName = locations.find(l => l.id === group.seller.location);

                return (
                    <div key={group.seller.id} className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 last:pb-0 last:mb-0">
                        {/* Seller Info */}
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src={group.seller.avatar}
                                alt={group.seller.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {group.seller.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {locationName?.nameAr || locationName?.name || group.seller.location}
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2">
                            {group.items.map((item) => (
                                <div key={item.product.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {item.product.name} × {item.quantity}
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                        {formatPrice(item.product.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Seller Subtotal */}
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('cart.sellerTotal')}
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(group.total)}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Grand Total */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {t('cart.orderTotal')}
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(grandTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
}
