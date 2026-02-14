// Cart Context - Provides cart state and actions to components

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    CartState,
    CartItem,
    SellerGroup,
    getCartFromStorage,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCart as clearCartService,
    getCartItemCount,
    getCartTotal,
    groupItemsBySeller,
    processCheckout,
    isProductInCart,
    getProductQuantityInCart,
} from '../services/cartService';

// Note: saveCartToStorage is not imported here because it's called internally
// by the cart service functions (addItemToCart, removeItemFromCart, etc.)
import { useShallow } from 'zustand/react/shallow';
import { useStore, type AppState } from '../store/useStore';

interface CartContextType {
    // State
    cart: CartState;
    itemCount: number;
    total: number;
    sellerGroups: SellerGroup[];
    isLoading: boolean;

    // Actions
    addToCart: (productId: string, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    checkout: () => void;
    isInCart: (productId: string) => boolean;
    getQuantity: (productId: string) => number;
    refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [cart, setCart] = useState<CartState>({ items: [], updatedAt: new Date().toISOString() });
    const [isLoading, setIsLoading] = useState(true);
    const language = useStore((state: AppState) => state.language);
    const { isAuthenticated, navigate, setAuthNextPage } = useStore(useShallow((state: AppState) => ({
        isAuthenticated: state.isAuthenticated,
        navigate: state.navigate,
        setAuthNextPage: state.setAuthNextPage,
    })));

    const ensureAuth = useCallback((): boolean => {
        if (isAuthenticated) return true;
        setAuthNextPage('cart');
        navigate('profile');
        return false;
    }, [isAuthenticated, navigate, setAuthNextPage]);

    // Initialize cart from storage
    useEffect(() => {
        const storedCart = getCartFromStorage();
        setCart(storedCart);
        setIsLoading(false);
    }, []);

    // Refresh cart data
    const refreshCart = useCallback(() => {
        const storedCart = getCartFromStorage();
        setCart(storedCart);
    }, []);

    // Add item to cart
    const addToCart = useCallback((productId: string, quantity: number = 1) => {
        if (!ensureAuth()) return;
        const updatedCart = addItemToCart(productId, quantity);
        setCart(updatedCart);
    }, [ensureAuth]);

    // Remove item from cart
    const removeFromCart = useCallback((productId: string) => {
        if (!ensureAuth()) return;
        const updatedCart = removeItemFromCart(productId);
        setCart(updatedCart);
    }, [ensureAuth]);

    // Update item quantity
    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (!ensureAuth()) return;
        const updatedCart = updateItemQuantity(productId, quantity);
        setCart(updatedCart);
    }, [ensureAuth]);

    // Clear cart
    const clearCart = useCallback(() => {
        if (!ensureAuth()) return;
        const emptyCart = clearCartService();
        setCart(emptyCart);
    }, [ensureAuth]);

    // Checkout - open WhatsApp for each seller
    const checkout = useCallback(() => {
        if (!ensureAuth()) return;
        const { openNextSeller } = processCheckout(language);
        // Open the first seller's WhatsApp
        openNextSeller();
        // Store the function for opening subsequent sellers
        // In a real app, you might want to show a modal asking the user to proceed to the next seller
    }, [ensureAuth, language]);

    // Check if product is in cart
    const isInCart = useCallback((productId: string) => {
        return isProductInCart(productId);
    }, []);

    // Get quantity of product in cart
    const getQuantity = useCallback((productId: string) => {
        return getProductQuantityInCart(productId);
    }, []);

    // Calculate derived values
    const itemCount = getCartItemCount();
    const total = getCartTotal();
    const sellerGroups = groupItemsBySeller();

    const value: CartContextType = {
        cart,
        itemCount,
        total,
        sellerGroups,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        isInCart,
        getQuantity,
        refreshCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

// Export types for use in other components
export type { CartItem, SellerGroup };
