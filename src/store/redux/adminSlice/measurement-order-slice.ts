import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IMeasurementOrderResponse, MeasurementOrderStatus } from "@/lib/server/measurementOrder/interface";

export interface MeasurementOrder extends IMeasurementOrderResponse {
  // Additional frontend-specific fields can be added here if needed
}

export interface MeasurementOrderState {
  orders: MeasurementOrder[];
  hasFetchedOrders: boolean;
}

const initialState: MeasurementOrderState = {
  orders: [],
  hasFetchedOrders: false,
};

const measurementOrderSlice = createSlice({
  name: "adminMeasurementOrders",
  initialState,
  reducers: {
    // Set all orders (replace existing)
    setOrders(state, action: PayloadAction<MeasurementOrder[]>) {
      state.orders = action.payload;
      state.hasFetchedOrders = true;
    },

    // Add a new order
    addOrder(state, action: PayloadAction<MeasurementOrder>) {
      state.orders.push(action.payload);
    },

    // Update an existing order
    updateOrder(
      state,
      action: PayloadAction<{ _id: string; updated: Partial<MeasurementOrder> }>
    ) {
      const index = state.orders.findIndex(
        (o) => o._id === action.payload._id
      );

      if (index !== -1) {
        state.orders[index] = {
          ...state.orders[index],
          ...action.payload.updated,
        };
      }
    },

    // Update order status
    updateOrderStatus(
      state,
      action: PayloadAction<{ _id: string; status: MeasurementOrderStatus }>
    ) {
      const index = state.orders.findIndex(
        (o) => o._id === action.payload._id
      );

      if (index !== -1) {
        state.orders[index].status = action.payload.status;
      }
    },

    // Remove an order
    removeOrder(state, action: PayloadAction<string>) {
      state.orders = state.orders.filter((o) => o._id !== action.payload);
    },

    // Clear all orders
    clearOrders(state) {
      state.orders = [];
      state.hasFetchedOrders = false;
    },
  },
});

export const measurementOrderActions = measurementOrderSlice.actions;
export default measurementOrderSlice;
