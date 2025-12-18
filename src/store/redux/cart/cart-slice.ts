import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ICartCalculationResponse } from "@/lib/server/cart/interface";

export interface CartState {
  cartData: ICartCalculationResponse | null;
}

const initialState: CartState = {
  cartData: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData(state, action: PayloadAction<ICartCalculationResponse>) {
      state.cartData = action.payload;
    },
    clearCartData(state) {
      state.cartData = null;
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice;
