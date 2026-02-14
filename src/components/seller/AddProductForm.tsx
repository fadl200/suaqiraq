/**
 * AddProductForm Component
 * Simplified product addition form for verified sellers
 * Only requires: name, description, image, category
 * Pre-fills seller info (phone, store name, delivery)
 */

import { useState, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { type Seller, categories } from '../../store/data';
import { useStore } from '../../store/useStore';
import { useSeller } from '../../contexts/SellerContext';
import { t } from '../../i18n';
import { SimplifiedProductInput } from '../../services/sellerService';

interface AddProductFormProps {
    seller: Seller;
    onProductAdded?: (product: SimplifiedProductInput) => void;
    onCancel?: () => void;
    className?: string;
}

export function AddProductForm({ seller, onProductAdded, onCancel, className = '' }: AddProductFormProps) {
    const language = useStore((s) => s.language);
    const { createProduct, uploadImage, isLoading } = useSeller();

    // Form state
    const [name, setName] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError(language === 'ar' ? 'يرجى اختيار صورة صالحة' : 'Please select a valid image');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB');
                return;
            }

            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setError(null);
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim() || !nameAr.trim()) {
            setError(language === 'ar' ? 'يرجى إدخال اسم المنتج باللغتين' : 'Please enter product name in both languages');
            return;
        }

        if (!description.trim() || !descriptionAr.trim()) {
            setError(language === 'ar' ? 'يرجى إدخال وصف المنتج باللغتين' : 'Please enter product description in both languages');
            return;
        }

        if (!price || parseFloat(price) <= 0) {
            setError(language === 'ar' ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price');
            return;
        }

        if (!category) {
            setError(language === 'ar' ? 'يرجى اختيار قسم المنتج' : 'Please select a category');
            return;
        }

        if (!imageFile && !imagePreview) {
            setError(language === 'ar' ? 'يرجى إضافة صورة للمنتج' : 'Please add a product image');
            return;
        }

        try {
            // Upload image if it's a file
            let imageUrl = imagePreview || '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            // Get category info
            const selectedCategory = categories.find(c => c.id === category);

            // Create product input
            const productInput: SimplifiedProductInput = {
                name: name.trim(),
                nameAr: nameAr.trim(),
                description: description.trim(),
                descriptionAr: descriptionAr.trim(),
                price: parseFloat(price),
                image: imageUrl,
                category: category,
                categoryAr: selectedCategory?.nameAr || category,
            };

            // Create the product
            await createProduct(seller.id, productInput);

            // Show success
            setSuccess(true);

            // Reset form
            setName('');
            setNameAr('');
            setDescription('');
            setDescriptionAr('');
            setPrice('');
            setCategory('');
            setImagePreview(null);
            setImageFile(null);

            // Callback
            onProductAdded?.(productInput);

            // Hide success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create product');
        }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-base font-bold text-gray-900">
                    {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'ar' ? 'أضف منتجك بسهولة - فقط المعلومات الأساسية' : 'Add your product easily - just the basics'}
                </p>
            </div>

            {/* Success message */}
            {success && (
                <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <Check size={18} className="text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                        {language === 'ar' ? 'تمت إضافة المنتج بنجاح!' : 'Product added successfully!'}
                    </span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <X size={18} className="text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'صورة المنتج' : 'Product Image'} *
                    </label>

                    {imagePreview ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={imagePreview}
                                alt="Product preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                        >
                            <Camera size={32} />
                            <span className="text-sm font-medium">
                                {language === 'ar' ? 'اضغط لإضافة صورة' : 'Tap to add image'}
                            </span>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                </div>

                {/* Product Name */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'ar' ? 'اسم المنتج' : 'Product Name'} *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={language === 'ar' ? 'بالإنجليزية' : 'In English'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'ar' ? 'اسم المنتج' : 'Product Name'} *
                        </label>
                        <input
                            type="text"
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            placeholder="بالعربية"
                            dir="rtl"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'ar' ? 'الوصف' : 'Description'} *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'بالإنجليزية' : 'In English'}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'ar' ? 'الوصف' : 'Description'} *
                        </label>
                        <textarea
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder="بالعربية"
                            dir="rtl"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                        />
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'ar' ? 'السعر (د.ع)' : 'Price (IQD)'} *
                    </label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'ar' ? 'القسم' : 'Category'} *
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white"
                    >
                        <option value="">{language === 'ar' ? 'اختر القسم' : 'Select category'}</option>
                        {categories.filter(c => c.id !== 'all').map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {language === 'ar' ? cat.nameAr : cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Pre-filled Seller Info (Read-only) */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'ar' ? 'معلومات البائع (محفوظة مسبقاً)' : 'Seller Info (Pre-saved)'}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{language === 'ar' ? 'المتجر:' : 'Store:'}</span>
                        <span className="font-medium text-gray-900">{language === 'ar' ? seller.nameAr : seller.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                        <span className="font-medium text-gray-900" dir="ltr">+{seller.whatsapp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{language === 'ar' ? 'التوصيل:' : 'Delivery:'}</span>
                        <span className="font-medium text-emerald-600">{seller.deliveryInfo || t('seller.deliveryToAllIraq')}</span>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}</span>
                            </>
                        ) : (
                            <span>{language === 'ar' ? 'إضافة المنتج' : 'Add Product'}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddProductForm;
