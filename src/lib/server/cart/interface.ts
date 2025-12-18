export interface ICartUserInput {
  productId: string; // MongoDB ObjectId as string
  variantId: string; // MongoDB ObjectId as string
  quantity: number;
}

export interface ICartItemResponse {
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  productDescription: string;
  productCategory: string;
  variantImageUrls: string[]; // Array of image URLs for the variant
  variantColor: string;
  variantSize: string;
  variantPrice: number;
  variantDiscountPrice: number;
  quantity: number;
  itemSubtotal: number;
  itemTotal: number;
  inStock: boolean;
  availableQuantity: number;
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
    quarterLength?: number;
    ankle?: number;
  };
}

export interface ICartCalculationResponse {
  items: ICartItemResponse[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingThreshold?: number; // Threshold amount for free shipping
}
