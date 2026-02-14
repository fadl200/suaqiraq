// WhatsApp utility for generating WhatsApp links with pre-filled messages

import { Product, Seller } from '../store/data';

export interface WhatsAppMessageData {
    seller: Seller;
    products: Array<{
        product: Product;
        quantity: number;
    }>;
    totalPrice: number;
    language: 'ar' | 'en';
}

/**
 * Generate a WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Format price with currency
 */
function formatPriceWithCurrency(price: number, language: 'ar' | 'en'): string {
    if (language === 'ar') {
        return `${price.toLocaleString('ar-IQ')} دينار`;
    }
    return `${price.toLocaleString('en-US')} IQD`;
}

/**
 * Generate order message for a seller in Arabic
 */
function generateArabicMessage(data: WhatsAppMessageData): string {
    const { seller, products, totalPrice } = data;

    let message = `مرحباً، أريد طلب المنتجات التالية من ${seller.nameAr}:\n\n`;

    products.forEach((item, index) => {
        const { product, quantity } = item;
        const itemTotal = product.price * quantity;
        message += `${index + 1}. ${product.nameAr} - الكمية: ${quantity} - السعر: ${formatPriceWithCurrency(itemTotal, 'ar')}\n`;
    });

    message += `\nالمجموع الكلي: ${formatPriceWithCurrency(totalPrice, 'ar')}\n\n`;
    message += `شكراً!\n\n`;
    message += `تم الإرسال من تطبيق سوق العراق 🇮🇶`;

    return message;
}

/**
 * Generate order message for a seller in English
 */
function generateEnglishMessage(data: WhatsAppMessageData): string {
    const { seller, products, totalPrice } = data;

    let message = `Hello, I would like to order the following products from ${seller.name}:\n\n`;

    products.forEach((item, index) => {
        const { product, quantity } = item;
        const itemTotal = product.price * quantity;
        message += `${index + 1}. ${product.name} - Quantity: ${quantity} - Price: ${formatPriceWithCurrency(itemTotal, 'en')}\n`;
    });

    message += `\nTotal: ${formatPriceWithCurrency(totalPrice, 'en')}\n\n`;
    message += `Thank you!\n\n`;
    message += `Sent from Souq Iraq 🇮🇶`;

    return message;
}

/**
 * Generate order message for a seller
 */
export function generateSellerMessage(data: WhatsAppMessageData): string {
    if (data.language === 'ar') {
        return generateArabicMessage(data);
    }
    return generateEnglishMessage(data);
}

/**
 * Open WhatsApp with pre-filled message
 */
export function openWhatsApp(phone: string, message: string): void {
    const url = generateWhatsAppUrl(phone, message);
    window.open(url, '_blank');
}

/**
 * Open WhatsApp for multiple sellers sequentially
 * Returns a function that can be used to open the next seller's WhatsApp
 */
export function openWhatsAppForSellers(
    sellersData: WhatsAppMessageData[],
    onProgress?: (currentIndex: number, total: number) => void
): () => void {
    let currentIndex = 0;

    const openNext = () => {
        if (currentIndex >= sellersData.length) {
            return;
        }

        const data = sellersData[currentIndex];
        const message = generateSellerMessage(data);
        openWhatsApp(data.seller.whatsapp, message);

        onProgress?.(currentIndex + 1, sellersData.length);
        currentIndex++;
    };

    // Open the first one immediately
    openNext();

    // Return function to open next
    return openNext;
}

/**
 * Generate a simple product inquiry message
 */
export function generateProductInquiryMessage(
    product: Product,
    language: 'ar' | 'en'
): string {
    if (language === 'ar') {
        return `مرحباً، أنا مهتم بالمنتج: ${product.nameAr}\n\nالسعر: ${formatPriceWithCurrency(product.price, 'ar')}\n\nتم الإرسال من تطبيق سوق العراق 🇮🇶`;
    }
    return `Hello, I am interested in the product: ${product.name}\n\nPrice: ${formatPriceWithCurrency(product.price, 'en')}\n\nSent from Souq Iraq 🇮🇶`;
}
