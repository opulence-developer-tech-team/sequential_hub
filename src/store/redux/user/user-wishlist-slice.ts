import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

export interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  productVariant: Array<{
    _id: string;
    imageUrls: string[]; // Array of image URLs for the variant
    color: string;
    size: string;
    quantity: number | null;
    price: number | null;
    discountPrice: number | null;
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
      quarterLength?: number;
      ankle?: number;
    };
  }>;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WishlistData {
  _id: string;
  productIds: string[];
  products?: WishlistProduct[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWishlistState {
  wishlist: WishlistData | null;
  hasFetchedWishlist: boolean;
}

const initialState: UserWishlistState = {
  wishlist: null,
  hasFetchedWishlist: false,
};

const userWishlistSlice = createSlice({
  name: "userWishlist",
  initialState,
  reducers: {
    setWishlist(state, action: PayloadAction<WishlistData>) {
      state.wishlist = action.payload;
      state.hasFetchedWishlist = true;
    },
    clearWishlist(state) {
      state.wishlist = null;
      state.hasFetchedWishlist = false;
    },
    addProductToWishlist(
      state,
      action: PayloadAction<{ productId: string; product?: WishlistProduct }>
    ) {
      const { productId, product } = action.payload;
      
      if (state.wishlist) {
        // Add productId if not already present
        if (!state.wishlist.productIds.includes(productId)) {
          state.wishlist.productIds.push(productId);
        }
        
        // Add product details to products array if provided and not already present
        if (product) {
          if (!state.wishlist.products) {
            state.wishlist.products = [];
          }
          // Check if product already exists in products array
          const productExists = state.wishlist.products.some(
            (p) => p._id === productId
          );
          if (!productExists) {
            state.wishlist.products.push(product);
          } else {
            // Update existing product if it exists (in case product details changed)
            const index = state.wishlist.products.findIndex(
              (p) => p._id === productId
            );
            if (index !== -1) {
              state.wishlist.products[index] = product;
            }
          }
        }
      } else {
        // Create new wishlist if it doesn't exist
        state.wishlist = {
          _id: "",
          productIds: [productId],
          userId: "",
          products: product ? [product] : undefined,
        };
        state.hasFetchedWishlist = true;
      }
    },
    removeProductFromWishlist(state, action: PayloadAction<string>) {
      if (state.wishlist) {
        // Remove from productIds array
        state.wishlist.productIds = state.wishlist.productIds.filter(
          (id) => id !== action.payload
        );
        // Also remove from populated products array if it exists
        if (state.wishlist.products) {
          state.wishlist.products = state.wishlist.products.filter(
            (product) => product._id !== action.payload
          );
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: any) => {
      // When using persistReducer with whitelist, the persisted state is automatically merged
      // into state before this handler runs. The persisted wishlist data is already in state.wishlist.
      // 
      // We preserve the persisted wishlist data (already merged by persistReducer) but reset
      // hasFetchedWishlist to false. This ensures:
      // 1. Cached wishlist data is shown immediately for better UX
      // 2. Fresh data is always fetched from the server when the wishlist tab is opened
      // 3. The account page checks hasFetchedWishlist and fetches if false
      
      // Always reset hasFetchedWishlist to false to trigger fresh fetch
      // The persisted wishlist data is already in state.wishlist (merged by persistReducer)
      state.hasFetchedWishlist = false;
    });
  },
});

export const {
  setWishlist,
  clearWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
} = userWishlistSlice.actions;

export default userWishlistSlice;
