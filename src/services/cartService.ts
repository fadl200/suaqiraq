// Cart Service - Handles all cart operations with localStorage persistence

import { Product, Seller, getSellerById, getProductById } from '../store/data';
import { generateSellerMessage, openWhatsApp, WhatsAppMessageData } from '../utils/whatsapp';

export interface CartItem {
    productId: string;
    quantity: number;
    sellerId: string;
    addedAt: string;
}

export interface CartState {
    items: CartItem[];
    updatedAt: string;
}

export interface SellerGroup {
    seller: Seller;
    items: Array<{
        product: Product;
        quantity: number;
    }>;
    total: number;
}

const CART_STORAGE_KEY = 'souq_iraq_cart';

/**
 * Get cart from localStorage
 */
export function getCartFromStorage(): CartState {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        if (cartJson) {
            return JSON.parse(cartJson);
        }
    } catch (error) {
        console.error('Error reading cart from storage:', error);
    }
    return { items: [], updatedAt: new Date().toISOString() };
}

/**
 * Save cart to localStorage
 */
export function saveCartToStorage(cart: CartState): void {
    try {
        cart.updatedAt = new Date().toISOString();
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
}

/**
 * Clear cart from localStorage
 */
export function clearCartFromStorage(): void {
    try {
        localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing cart from storage:', error);
    }
}

/**
 * Add item to cart
 */
export function addItemToCart(productId: string, quantity: number = 1): CartState {
    const cart = getCartFromStorage();
    const product = getProductById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    const existingIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
    } else {
        cart.items.push({
            productId,
            quantity,
            sellerId: product.sellerId,
            addedAt: new Date().toISOString(),
        });
    }

    saveCartToStorage(cart);
    return cart;
}

/**
 * Remove item from cart
 */
export function removeItemFromCart(productId: string): CartState {
    const cart = getCartFromStorage();
    cart.items = cart.items.filter(item => item.productId !== productId);
    saveCartToStorage(cart);
    return cart;
}

/**
 * Update item quantity
 */
export function updateItemQuantity(productId: string, quantity: number): CartState {
    const cart = getCartFromStorage();
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex >= 0) {
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }
    }

    saveCartToStorage(cart);
    return cart;
}

/**
 * Clear all items from cart
 */
export function clearCart(): CartState {
    const cart: CartState = { items: [], updatedAt: new Date().toISOString() };
    saveCartToStorage(cart);
    return cart;
}

/**
 * Get cart item count
 */
export function getCartItemCount(): number {
    const cart = getCartFromStorage();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get cart total price
 */
export function getCartTotal(): number {
    const cart = getCartFromStorage();
    return cart.items.reduce((total, item) => {
        const product = getProductById(item.productId);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

/**
 * Group cart items by seller
 */
export function groupItemsBySeller(): SellerGroup[] {
    const cart = getCartFromStorage();
    const groups: Map<string, SellerGroup> = new Map();

    cart.items.forEach(item => {
        const product = getProductById(item.productId);
        const seller = getSellerById(item.sellerId);

        if (!product || !seller) return;

        if (!groups.has(item.sellerId)) {
            groups.set(item.sellerId, {
                seller,
                items: [],
                total: 0,
            });
        }

        const group = groups.get(item.sellerId)!;
        group.items.push({ product, quantity: item.quantity });
        group.total += product.price * item.quantity;
    });

    return Array.from(groups.values());
}

/**
 * Get detailed cart items with product and seller info
 */
export function getDetailedCartItems(): Array<{
    item: CartItem;
    product: Product;
    seller: Seller;
}> {
    const cart = getCartFromStorage();

    return cart.items
        .map(item => {
            const product = getProductById(item.productId);
            const seller = getSellerById(item.sellerId);

            if (!product || !seller) return null;

            return { item, product, seller };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Process checkout - open WhatsApp for each seller
 */
export function processCheckout(language: 'ar' | 'en'): {
    sellersData: WhatsAppMessageData[];
    openNextSeller: () => void;
} {
    const groups = groupItemsBySeller();

    const sellersData: WhatsAppMessageData[] = groups.map(group => ({
        seller: group.seller,
        products: group.items,
        totalPrice: group.total,
        language,
    }));

    let currentIndex = 0;

    const openNextSeller = () => {
        if (currentIndex >= sellersData.length) {
            return false;
        }

        const data = sellersData[currentIndex];
        const message = generateSellerMessage(data);
        openWhatsApp(data.seller.whatsapp, message);
        currentIndex++;

        return currentIndex < sellersData.length;
    };

    return { sellersData, openNextSeller };
}

/**
 * Check if product is in cart
 */
export function isProductInCart(productId: string): boolean {
    const cart = getCartFromStorage();
    return cart.items.some(item => item.productId === productId);
}

/**
 * Get quantity of product in cart
 */
export function getProductQuantityInCart(productId: string): number {
    const cart = getCartFromStorage();
    const item = cart.items.find(item => item.productId === productId);
    return item?.quantity || 0;
}
