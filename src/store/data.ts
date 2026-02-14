// Mock data for the Iraqi Smart Marketplace

export interface Seller {
  id: string;
  name: string;
  nameAr: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  locationAr: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  isVerified: boolean;
  rating: number;
  totalRatings: number;
  totalSales: number;
  joinedDate: string;
  categories: string[];
  viewCount: number;
  // New fields for verified seller system
  deliveryInfo: string; // Default: "توصيل لكل العراق" (Delivery to all Iraq)
  productCount: number; // Number of products from this seller
  featuredProductId?: string;
}

// Product verification status type
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'none';

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  categoryAr: string;
  inStock: boolean;
  viewCount: number;
  createdAt: string;
  tags: string[];
  // Product verification fields
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verificationBadge?: string;
}

export interface Rating {
  id: string;
  sellerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export const categories = [
  { id: 'all', name: 'All', nameAr: 'الكل', icon: '🏪', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'fashion', name: 'Fashion', nameAr: 'أزياء', icon: '👗', color: 'bg-pink-100 text-pink-700' },
  { id: 'electronics', name: 'Electronics', nameAr: 'إلكترونيات', icon: '📱', color: 'bg-blue-100 text-blue-700' },
  { id: 'beauty', name: 'Beauty', nameAr: 'تجميل', icon: '💄', color: 'bg-purple-100 text-purple-700' },
  { id: 'home', name: 'Home', nameAr: 'منزل', icon: '🏠', color: 'bg-amber-100 text-amber-700' },
  { id: 'food', name: 'Food', nameAr: 'طعام', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  { id: 'sports', name: 'Sports', nameAr: 'رياضة', icon: '⚽', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'kids', name: 'Kids', nameAr: 'أطفال', icon: '🧸', color: 'bg-red-100 text-red-700' },
];

export const locations = [
  { id: 'all', name: 'All Iraq', nameAr: 'كل العراق' },
  { id: 'baghdad', name: 'Baghdad', nameAr: 'بغداد' },
  { id: 'basra', name: 'Basra', nameAr: 'البصرة' },
  { id: 'erbil', name: 'Erbil', nameAr: 'أربيل' },
  { id: 'sulaymaniyah', name: 'Sulaymaniyah', nameAr: 'السليمانية' },
  { id: 'najaf', name: 'Najaf', nameAr: 'النجف' },
  { id: 'karbala', name: 'Karbala', nameAr: 'كربلاء' },
  { id: 'mosul', name: 'Mosul', nameAr: 'الموصل' },
  { id: 'kirkuk', name: 'Kirkuk', nameAr: 'كركوك' },
];

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'S';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function makePlaceholderSvg(params: {
  id: string;
  width: number;
  height: number;
  label: string;
  subtitle?: string;
  rounded?: number;
}): string {
  const hue = hashToHue(params.id);
  const hue2 = (hue + 40) % 360;
  const rounded = Math.max(0, Math.min(params.rounded ?? 24, Math.min(params.width, params.height) / 2));
  const fontSize = Math.max(14, Math.floor(Math.min(params.width, params.height) / 8));
  const subtitleSize = Math.max(12, Math.floor(fontSize * 0.55));
  const subtitle = params.subtitle?.trim();

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue} 75% 55%)"/>
          <stop offset="100%" stop-color="hsl(${hue2} 75% 45%)"/>
        </linearGradient>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="${params.width}" height="${params.height}" rx="${rounded}" fill="url(#g)"/>
      <g filter="url(#s)">
        <rect x="${Math.floor(params.width * 0.06)}" y="${Math.floor(params.height * 0.12)}" width="${Math.floor(params.width * 0.88)}" height="${Math.floor(params.height * 0.76)}" rx="${Math.max(12, Math.floor(rounded * 0.6))}" fill="rgba(255,255,255,0.12)"/>
      </g>
      <text x="50%" y="${subtitle ? '48%' : '55%'}" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="800"
        font-size="${fontSize}" fill="rgba(255,255,255,0.95)">${params.label}</text>
      ${subtitle ? `<text x="50%" y="66%" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="600"
        font-size="${subtitleSize}" fill="rgba(255,255,255,0.85)">${subtitle}</text>` : ''}
    </svg>`
  );
}

function makeSellerAvatar(name: string, id: string): string {
  return makePlaceholderSvg({ id: `seller-avatar:${id}:${name}`, width: 150, height: 150, label: getInitials(name), rounded: 32 });
}

function makeSellerCover(name: string, id: string): string {
  return makePlaceholderSvg({ id: `seller-cover:${id}:${name}`, width: 800, height: 300, label: name, subtitle: 'Souq Iraq', rounded: 28 });
}

function makeProductImage(name: string, id: string): string {
  return makePlaceholderSvg({ id: `product:${id}:${name}`, width: 400, height: 400, label: name, subtitle: 'IQD', rounded: 36 });
}

export let sellers: Seller[] = [
  {
    id: 's1',
    name: 'Noor Fashion',
    nameAr: 'نور فاشن',
    avatar: makeSellerAvatar('Noor Fashion', 's1'),
    coverImage: makeSellerCover('Noor Fashion', 's1'),
    bio: 'Premium women\'s fashion from Turkey & Dubai. Shipping all over Iraq 🇮🇶',
    location: 'baghdad',
    locationAr: 'بغداد',
    whatsapp: '9647701234567',
    instagram: 'noorfashion_iq',
    tiktok: 'noorfashion',
    isVerified: true,
    rating: 4.8,
    totalRatings: 234,
    totalSales: 1520,
    joinedDate: '2023-06-15',
    categories: ['fashion'],
    viewCount: 15600,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 3,
  },
  {
    id: 's2',
    name: 'Tech Zone IQ',
    nameAr: 'تك زون',
    avatar: makeSellerAvatar('Tech Zone IQ', 's2'),
    coverImage: makeSellerCover('Tech Zone IQ', 's2'),
    bio: 'Latest smartphones, accessories & gadgets. Original products with warranty ✅',
    location: 'erbil',
    locationAr: 'أربيل',
    whatsapp: '9647702345678',
    instagram: 'techzone_iq',
    tiktok: 'techzoneiq',
    isVerified: true,
    rating: 4.6,
    totalRatings: 189,
    totalSales: 980,
    joinedDate: '2023-08-20',
    categories: ['electronics'],
    viewCount: 12300,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 3,
  },
  {
    id: 's3',
    name: 'Bella Beauty',
    nameAr: 'بيلا بيوتي',
    avatar: makeSellerAvatar('Bella Beauty', 's3'),
    coverImage: makeSellerCover('Bella Beauty', 's3'),
    bio: 'Korean & French skincare products. 100% original. Free samples with every order 🎁',
    location: 'basra',
    locationAr: 'البصرة',
    whatsapp: '9647703456789',
    instagram: 'bellabeauty_iq',
    tiktok: 'bellabeautyiq',
    isVerified: true,
    rating: 4.9,
    totalRatings: 312,
    totalSales: 2100,
    joinedDate: '2023-03-10',
    categories: ['beauty'],
    viewCount: 21400,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 3,
  },
  {
    id: 's4',
    name: 'Iraqi Home Decor',
    nameAr: 'ديكور عراقي',
    avatar: makeSellerAvatar('Iraqi Home Decor', 's4'),
    coverImage: makeSellerCover('Iraqi Home Decor', 's4'),
    bio: 'Transform your home with our curated collection of modern & traditional decor 🏡',
    location: 'najaf',
    locationAr: 'النجف',
    whatsapp: '9647704567890',
    instagram: '',
    tiktok: '',
    isVerified: false,
    rating: 4.3,
    totalRatings: 87,
    totalSales: 450,
    joinedDate: '2024-01-05',
    categories: ['home'],
    viewCount: 5600,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 2,
  },
  {
    id: 's5',
    name: 'Mama\'s Kitchen',
    nameAr: 'مطبخ ماما',
    avatar: makeSellerAvatar('Mama\'s Kitchen', 's5'),
    coverImage: makeSellerCover('Mama\'s Kitchen', 's5'),
    bio: 'Homemade Iraqi sweets & pastries. Daily fresh. Delivery in Baghdad only 🍰',
    location: 'baghdad',
    locationAr: 'بغداد',
    whatsapp: '9647705678901',
    instagram: 'mamaskitchen_iq',
    tiktok: 'mamaskitcheniq',
    isVerified: true,
    rating: 4.7,
    totalRatings: 156,
    totalSales: 890,
    joinedDate: '2023-11-01',
    categories: ['food'],
    viewCount: 9800,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 2,
  },
  {
    id: 's6',
    name: 'Sport Planet',
    nameAr: 'سبورت بلانيت',
    avatar: makeSellerAvatar('Sport Planet', 's6'),
    coverImage: makeSellerCover('Sport Planet', 's6'),
    bio: 'Your one-stop shop for sports gear, gym equipment & activewear 💪',
    location: 'sulaymaniyah',
    locationAr: 'السليمانية',
    whatsapp: '9647706789012',
    instagram: '',
    tiktok: '',
    isVerified: false,
    rating: 4.4,
    totalRatings: 67,
    totalSales: 340,
    joinedDate: '2024-02-15',
    categories: ['sports'],
    viewCount: 4200,
    deliveryInfo: 'توصيل لكل العراق',
    productCount: 2,
  },
];

export let products: Product[] = [
  // Noor Fashion products - Verified seller (s1)
  {
    id: 'p1', sellerId: 's1', name: 'Turkish Abaya Collection', nameAr: 'عبايات تركية',
    description: 'Premium Turkish abayas with elegant embroidery. Available in multiple colors and sizes.',
    descriptionAr: 'عبايات تركية فاخرة مع تطريز أنيق. متوفرة بعدة ألوان ومقاسات.',
    price: 65000, originalPrice: 85000, currency: 'IQD',
    images: [makeProductImage('Turkish Abaya Collection', 'p1')],
    category: 'fashion', categoryAr: 'أزياء', inStock: true, viewCount: 1230,
    createdAt: '2024-03-01', tags: ['abaya', 'turkish', 'women'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-05',
  },
  {
    id: 'p2', sellerId: 's1', name: 'Designer Handbag', nameAr: 'حقيبة يد فاخرة',
    description: 'Luxury designer-inspired handbag. High quality leather finish.',
    descriptionAr: 'حقيبة يد فاخرة. تشطيب جلد عالي الجودة.',
    price: 45000, currency: 'IQD',
    images: [makeProductImage('Designer Handbag', 'p2')],
    category: 'fashion', categoryAr: 'أزياء', inStock: true, viewCount: 890,
    createdAt: '2024-03-05', tags: ['bag', 'leather', 'women'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-08',
  },
  {
    id: 'p3', sellerId: 's1', name: 'Summer Dress Set', nameAr: 'طقم فستان صيفي',
    description: 'Light and breezy summer dress set. Perfect for Iraqi summer weather.',
    descriptionAr: 'طقم فستان صيفي خفيف ومنعش. مثالي لصيف العراق.',
    price: 35000, originalPrice: 42000, currency: 'IQD',
    images: [makeProductImage('Summer Dress Set', 'p3')],
    category: 'fashion', categoryAr: 'أزياء', inStock: true, viewCount: 2100,
    createdAt: '2024-03-10', tags: ['dress', 'summer', 'women'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-12',
  },

  // Tech Zone products - Verified seller (s2)
  {
    id: 'p4', sellerId: 's2', name: 'iPhone 15 Pro Max', nameAr: 'آيفون 15 برو ماكس',
    description: 'Brand new iPhone 15 Pro Max 256GB. Original with 1 year warranty.',
    descriptionAr: 'آيفون 15 برو ماكس 256 جيجا جديد. أصلي مع ضمان سنة.',
    price: 1850000, currency: 'IQD',
    images: [makeProductImage('iPhone 15 Pro Max', 'p4')],
    category: 'electronics', categoryAr: 'إلكترونيات', inStock: true, viewCount: 5400,
    createdAt: '2024-03-02', tags: ['iphone', 'apple', 'smartphone'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-04',
  },
  {
    id: 'p5', sellerId: 's2', name: 'Samsung Galaxy Buds', nameAr: 'سماعات سامسونج',
    description: 'Samsung Galaxy Buds2 Pro. Active noise cancellation. Original.',
    descriptionAr: 'سماعات سامسونج جالاكسي بادز2 برو. إلغاء ضوضاء فعال. أصلي.',
    price: 175000, originalPrice: 210000, currency: 'IQD',
    images: [makeProductImage('Samsung Galaxy Buds', 'p5')],
    category: 'electronics', categoryAr: 'إلكترونيات', inStock: true, viewCount: 1800,
    createdAt: '2024-03-08', tags: ['samsung', 'earbuds', 'audio'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-10',
  },
  {
    id: 'p6', sellerId: 's2', name: 'Apple Watch Series 9', nameAr: 'ساعة أبل سيريز 9',
    description: 'Apple Watch Series 9 GPS. Health & fitness tracking. Multiple bands.',
    descriptionAr: 'ساعة أبل سيريز 9 GPS. تتبع الصحة واللياقة. أحزمة متعددة.',
    price: 650000, currency: 'IQD',
    images: [makeProductImage('Apple Watch Series 9', 'p6')],
    category: 'electronics', categoryAr: 'إلكترونيات', inStock: false, viewCount: 3200,
    createdAt: '2024-02-28', tags: ['apple', 'watch', 'smartwatch'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-02',
  },

  // Bella Beauty products - Verified seller (s3)
  {
    id: 'p7', sellerId: 's3', name: 'Korean Skincare Set', nameAr: 'مجموعة عناية كورية',
    description: '10-step Korean skincare routine set. Includes cleanser, toner, serum & more.',
    descriptionAr: 'مجموعة عناية كورية من 10 خطوات. تشمل منظف وتونر وسيروم والمزيد.',
    price: 85000, originalPrice: 120000, currency: 'IQD',
    images: [makeProductImage('Korean Skincare Set', 'p7')],
    category: 'beauty', categoryAr: 'تجميل', inStock: true, viewCount: 4300,
    createdAt: '2024-03-03', tags: ['skincare', 'korean', 'set'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-06',
  },
  {
    id: 'p8', sellerId: 's3', name: 'MAC Lipstick Collection', nameAr: 'مجموعة أحمر شفاه ماك',
    description: 'Original MAC lipstick set. 6 trending shades. Long-lasting formula.',
    descriptionAr: 'مجموعة أحمر شفاه ماك أصلية. 6 ألوان رائجة. تركيبة تدوم طويلاً.',
    price: 55000, currency: 'IQD',
    images: [makeProductImage('MAC Lipstick Collection', 'p8')],
    category: 'beauty', categoryAr: 'تجميل', inStock: true, viewCount: 2900,
    createdAt: '2024-03-07', tags: ['mac', 'lipstick', 'makeup'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-09',
  },
  {
    id: 'p9', sellerId: 's3', name: 'Hair Care Bundle', nameAr: 'حزمة العناية بالشعر',
    description: 'Complete hair care bundle with shampoo, conditioner, and hair mask.',
    descriptionAr: 'حزمة كاملة للعناية بالشعر مع شامبو وبلسم وماسك شعر.',
    price: 42000, originalPrice: 58000, currency: 'IQD',
    images: [makeProductImage('Hair Care Bundle', 'p9')],
    category: 'beauty', categoryAr: 'تجميل', inStock: true, viewCount: 1600,
    createdAt: '2024-03-12', tags: ['hair', 'shampoo', 'care'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-14',
  },

  // Home Decor products - Unverified seller (s4)
  {
    id: 'p10', sellerId: 's4', name: 'Modern Table Lamp', nameAr: 'مصباح طاولة عصري',
    description: 'Elegant modern table lamp with USB charging port. LED warm light.',
    descriptionAr: 'مصباح طاولة عصري أنيق مع منفذ شحن USB. إضاءة LED دافئة.',
    price: 28000, currency: 'IQD',
    images: [makeProductImage('Modern Table Lamp', 'p10')],
    category: 'home', categoryAr: 'منزل', inStock: true, viewCount: 780,
    createdAt: '2024-03-04', tags: ['lamp', 'modern', 'decor'],
    isVerified: false, verificationStatus: 'none',
  },
  {
    id: 'p11', sellerId: 's4', name: 'Decorative Cushion Set', nameAr: 'طقم وسائد ديكور',
    description: 'Set of 4 premium decorative cushions. Traditional Iraqi patterns.',
    descriptionAr: 'طقم من 4 وسائد ديكور فاخرة. نقوش عراقية تقليدية.',
    price: 38000, originalPrice: 50000, currency: 'IQD',
    images: [makeProductImage('Decorative Cushion Set', 'p11')],
    category: 'home', categoryAr: 'منزل', inStock: true, viewCount: 560,
    createdAt: '2024-03-09', tags: ['cushion', 'traditional', 'decor'],
    isVerified: false, verificationStatus: 'pending', // Pending verification
  },

  // Food products - Verified seller (s5)
  {
    id: 'p12', sellerId: 's5', name: 'Iraqi Kleicha Box', nameAr: 'علبة كليجة عراقية',
    description: 'Homemade Iraqi Kleicha with dates & walnuts. 1kg box. Daily fresh.',
    descriptionAr: 'كليجة عراقية منزلية بالتمر والجوز. علبة 1 كيلو. طازجة يومياً.',
    price: 25000, currency: 'IQD',
    images: [makeProductImage('Iraqi Kleicha Box', 'p12')],
    category: 'food', categoryAr: 'طعام', inStock: true, viewCount: 3400,
    createdAt: '2024-03-06', tags: ['kleicha', 'sweets', 'iraqi'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-08',
  },
  {
    id: 'p13', sellerId: 's5', name: 'Baklava Premium Box', nameAr: 'علبة بقلاوة فاخرة',
    description: 'Premium handmade baklava with pistachios. Perfect gift box.',
    descriptionAr: 'بقلاوة يدوية فاخرة بالفستق. علبة هدايا مثالية.',
    price: 35000, originalPrice: 40000, currency: 'IQD',
    images: [makeProductImage('Baklava Premium Box', 'p13')],
    category: 'food', categoryAr: 'طعام', inStock: true, viewCount: 2100,
    createdAt: '2024-03-11', tags: ['baklava', 'sweets', 'pistachio'],
    isVerified: true, verificationStatus: 'verified', verifiedAt: '2024-03-13',
  },

  // Sports products - Unverified seller (s6)
  {
    id: 'p14', sellerId: 's6', name: 'Yoga Mat Premium', nameAr: 'بساط يوغا فاخر',
    description: 'Non-slip premium yoga mat. 6mm thick. Carrying strap included.',
    descriptionAr: 'بساط يوغا فاخر مانع للانزلاق. سمك 6 ملم. مع حزام حمل.',
    price: 22000, currency: 'IQD',
    images: [makeProductImage('Yoga Mat Premium', 'p14')],
    category: 'sports', categoryAr: 'رياضة', inStock: true, viewCount: 450,
    createdAt: '2024-03-13', tags: ['yoga', 'mat', 'fitness'],
    isVerified: false, verificationStatus: 'none',
  },
  {
    id: 'p15', sellerId: 's6', name: 'Dumbbell Set 20kg', nameAr: 'طقم دمبل 20 كغ',
    description: 'Adjustable dumbbell set 20kg. Chrome plated. With carry case.',
    descriptionAr: 'طقم دمبل قابل للتعديل 20 كغ. مطلي بالكروم. مع حقيبة حمل.',
    price: 55000, originalPrice: 70000, currency: 'IQD',
    images: [makeProductImage('Dumbbell Set 20kg', 'p15')],
    category: 'sports', categoryAr: 'رياضة', inStock: true, viewCount: 670,
    createdAt: '2024-03-14', tags: ['dumbbell', 'gym', 'weights'],
    isVerified: false, verificationStatus: 'none',
  },
];

export let ratings: Rating[] = [
  { id: 'r1', sellerId: 's1', buyerName: 'Ahmed M.', rating: 5, comment: 'Excellent quality! Fast delivery to Baghdad.', verified: true, date: '2024-03-10' },
  { id: 'r2', sellerId: 's1', buyerName: 'Sara K.', rating: 4, comment: 'Beautiful abaya, exactly as shown. Highly recommend!', verified: true, date: '2024-03-08' },
  { id: 'r3', sellerId: 's2', buyerName: 'Omar H.', rating: 5, comment: 'Original iPhone, great price. Very trustworthy seller.', verified: true, date: '2024-03-09' },
  { id: 'r4', sellerId: 's3', buyerName: 'Fatima R.', rating: 5, comment: 'Amazing skincare products! My skin loves them ❤️', verified: true, date: '2024-03-11' },
  { id: 'r5', sellerId: 's3', buyerName: 'Zainab A.', rating: 5, comment: 'Best beauty store in Iraq! Always original products.', verified: true, date: '2024-03-07' },
  { id: 'r6', sellerId: 's5', buyerName: 'Mustafa T.', rating: 5, comment: 'The kleicha tastes like my grandmother\'s recipe! 😍', verified: true, date: '2024-03-12' },
  { id: 'r7', sellerId: 's4', buyerName: 'Layla S.', rating: 4, comment: 'Good quality cushions. Delivery took 3 days.', verified: true, date: '2024-03-13' },
  { id: 'r8', sellerId: 's2', buyerName: 'Ali N.', rating: 4, comment: 'Galaxy Buds work perfectly. Good packaging.', verified: true, date: '2024-03-14' },
];

export function replaceMarketplaceData(next: { sellers?: Seller[]; products?: Product[]; ratings?: Rating[] }): void {
  if (next.sellers) sellers = next.sellers;
  if (next.products) products = next.products;
  if (next.ratings) ratings = next.ratings;
}

export function formatPrice(price: number): string {
  return price.toLocaleString('en-US') + ' IQD';
}

export function getSellerById(id: string): Seller | undefined {
  const seller = sellers.find(s => s.id === id);
  if (!seller) return undefined;
  const { average, count } = getSellerRatingSummary(id);
  return { ...seller, rating: average, totalRatings: count };
}

export function getProductsBySeller(sellerId: string): Product[] {
  return products.filter(p => p.sellerId === sellerId);
}

export function getRatingsBySeller(sellerId: string): Rating[] {
  return ratings.filter(r => r.sellerId === sellerId);
}

export function getSellerRatingSummary(sellerId: string): { average: number; count: number } {
  const sellerRatings = getRatingsBySeller(sellerId);
  const count = sellerRatings.length;
  if (count === 0) return { average: 0, count: 0 };
  const total = sellerRatings.reduce((sum, r) => sum + r.rating, 0);
  const average = Math.round((total / count) * 10) / 10;
  return { average, count };
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function generateWhatsAppLink(phone: string, productName: string): string {
  const message = encodeURIComponent(`Hi, I am interested in: ${productName}\n\nSent from Souq Iraq 🇮🇶`);
  return `https://wa.me/${phone}?text=${message}`;
}
