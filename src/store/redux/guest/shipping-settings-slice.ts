import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ShippingLocationFee {
  location: string;
  fee: number;
}

export interface ShippingSettingsState {
  freeShippingThreshold: number | null;
  locationFees: ShippingLocationFee[];
  hasFetched: boolean;
}

const initialState: ShippingSettingsState = {
  freeShippingThreshold: null,
  locationFees: [],
  hasFetched: false,
};

const shippingSettingsSlice = createSlice({
  name: "shippingSettings",
  initialState,
  reducers: {
    setShippingSettings(
      state,
      action: PayloadAction<{
        freeShippingThreshold: number;
        locationFees: ShippingLocationFee[];
      }>
    ) {
      state.freeShippingThreshold = action.payload.freeShippingThreshold;
      state.locationFees = action.payload.locationFees;
      state.hasFetched = true;
    },
    clearShippingSettings(state) {
      state.freeShippingThreshold = null;
      state.locationFees = [];
      state.hasFetched = false;
    },
  },
});

export const shippingSettingsActions = shippingSettingsSlice.actions;
export default shippingSettingsSlice;





























