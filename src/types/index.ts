import { ClothingCategory, ProductSize } from "./enum";

export interface IProductVariant {
  _id: string;
  imageUrls: string[]; // Array of image URLs for the variant (multiple angles, details, etc.)
  color: string;
  quantity: number | null; // null indicates invalid/missing data
  price: number | null; // null indicates invalid/missing data
  discountPrice: number | null; // null indicates invalid/missing data
  size: ProductSize;
  inStock: boolean;
  measurements?: {
    neck?: number;
    shoulder?: number;
    chest?: number;
    shortSleeve?: number;
    longSleeve?: number;
    roundSleeve?: number;
    tummy?: number;
    topLength?: number;
    waist?: number;
    laps?: number;
    kneelLength?: number;
    roundKneel?: number;
    trouserLength?: number;
    ankle?: number;
  };
}


export interface Product {
 _id: string;
  adminId: string;
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner?: string; // Only available in admin context
  productVariant: IProductVariant[];
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  customMeasurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    length?: number;
    sleeve?: number;
    inseam?: number;
    width?: number;
    height?: number;
  };
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  createdAt: Date;
}

export interface MeasurementOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  category: string;
  subcategory: string;
  measurements: {
    neck: number;
    shoulder: number;
    sleeveLength: number;
    roundSleeve: number;
    chest: number;
    tummy: number;
    shirtLength: number;
    hip: number;
    laps: number;
    kneel: number;
    roundKneel: number;
    trouserLength: number;
    ankle: number;
  };
  preferredStyle: string;
  notes: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  orderDate: Date;
  estimatedCompletion: Date;
  price: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}


export interface Country {
  name: string;
  phoneCode: string;
  flag: string;
  countryCode: string;
}
