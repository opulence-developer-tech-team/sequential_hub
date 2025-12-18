import { ClothingCategory, ProductSize } from "@/types/enum";
import { Document, Types } from "mongoose";

interface IProductVariant {
  imageUrls: string[]; // Array of image URLs for the variant (multiple angles, details, etc.)
  color: string;
  quantity: number;
  price: number;
  discountPrice: number;
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

export interface IProduct extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner: string;
  productVariant: IProductVariant[];
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAddProductInput {
  adminId: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner: string;
  productVariant: IProductVariant[];
  isFeatured: boolean;
  inStock: boolean;
}

export interface IAddProductUserInput {
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner: string;
  productVariant: IProductVariant[];
  isFeatured: boolean;
  inStock: boolean;
}

export interface IEditProductUserInput {
  productId: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner: string;
  productVariant: IProductVariant[];
  isFeatured: boolean;
  inStock: boolean;
}

export interface IEditProductInput {
  productId: Types.ObjectId;
  name: string;
  description: string;
  slug: string;
  category: ClothingCategory;
  material: string;
  productOwner: string;
  productVariant: IProductVariant[];
  isFeatured: boolean;
  inStock: boolean;
}
