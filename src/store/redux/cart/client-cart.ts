import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE, PersistConfig } from "redux-persist";

export interface ClientCartItemParams {
  productId: string; // MongoDB ObjectId as string
  variantId: string; // MongoDB ObjectId as string
  quantity: number;
}

export interface ClientCartItemSliceParams {
  clientCartItems: ClientCartItemParams[];
  cartLength: number;
}

const cartInitialState: ClientCartItemSliceParams = {
  clientCartItems: [],
  cartLength: 0,
};

const clientCartSlice = createSlice({
  name: "client-cart",
  initialState: cartInitialState,
  reducers: {
    addToClientCart(state, action: PayloadAction<ClientCartItemParams>) {
      const { productId, variantId, quantity } = action.payload;

      // Validate quantity
      if (quantity <= 0) {
        return; // Don't add items with invalid quantity
      }

      // Ensure clientCartItems is always an array (defensive check)
      if (!Array.isArray(state.clientCartItems)) {
        state.clientCartItems = [];
      }

      // Find if item already exists in cart (same productId and variantId)
      const existingItemIndex = state.clientCartItems.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (existingItemIndex !== -1) {
        // Item exists, increment quantity
        state.clientCartItems[existingItemIndex].quantity += quantity;
      } else {
        // Item doesn't exist, add new item
        state.clientCartItems.push({
          productId,
          variantId,
          quantity,
        });
      }

      // Update cart length (number of unique items/variants)
      state.cartLength = state.clientCartItems.length;
    },
    removeFromClientCart(state, action: PayloadAction<string>) {
      // Ensure clientCartItems is always an array (defensive check)
      if (!Array.isArray(state.clientCartItems)) {
        state.clientCartItems = [];
        state.cartLength = 0;
        return;
      }

      // Remove item by variantId (assuming variantId is unique)
      state.clientCartItems = state.clientCartItems.filter(
        (item) => item.variantId !== action.payload
      );

      // Update cart length (number of unique items/variants, not total quantity)
      state.cartLength = state.clientCartItems.length;
    },
    updateCartItemQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      // Ensure clientCartItems is always an array (defensive check)
      if (!Array.isArray(state.clientCartItems)) {
        state.clientCartItems = [];
        state.cartLength = 0;
        return;
      }

      // id here refers to variantId
      const { id: variantId, quantity } = action.payload;
      const item = state.clientCartItems.find(
        (item) => item.variantId === variantId
      );

      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.clientCartItems = state.clientCartItems.filter(
            (item) => item.variantId !== variantId
          );
        } else {
          item.quantity = quantity;
        }
      }

      // Update cart length (number of unique items/variants, not total quantity)
      state.cartLength = state.clientCartItems.length;
    },
    resetClientCart(state) {
      state.clientCartItems = [];
      state.cartLength = 0;
    },
  },
  extraReducers: (builder) => {
    // Recalculate cartLength when state is rehydrated from persistence
    builder.addCase(REHYDRATE, (state, action: any) => {
      // When using persistReducer, the persisted state is merged into state before this runs
      // However, we need to ensure cartLength is recalculated from clientCartItems
      
      // First, try to get clientCartItems from the current state (already merged by persistReducer)
      let clientCartItems = state.clientCartItems;
      
      // If state doesn't have items, check the payload as fallback
      if (!Array.isArray(clientCartItems) || clientCartItems.length === 0) {
        if (action.payload) {
          // The payload might contain the persisted state directly or nested
          const persistedState = action.payload.clientCart || action.payload;
          if (persistedState && Array.isArray(persistedState.clientCartItems)) {
            clientCartItems = persistedState.clientCartItems;
          }
        }
      }
      
      // Ensure clientCartItems is always an array
      if (!Array.isArray(clientCartItems)) {
        clientCartItems = [];
      }
      
      // Update state with the correct values
      state.clientCartItems = clientCartItems;
      // Recalculate cartLength from clientCartItems
      state.cartLength = clientCartItems.length;
    });
  },
});

export const clientCartActions = clientCartSlice.actions;
export default clientCartSlice;
