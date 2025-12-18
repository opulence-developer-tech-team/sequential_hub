import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IOrderResponse, OrderStatus, PaymentStatus } from "@/lib/server/order/interface";

export interface Order extends IOrderResponse {
  // Additional frontend-specific fields can be added here if needed
}

export interface OrderState {
  orders: Order[];
  hasFetchedOrders: boolean;
}

const initialState: OrderState = {
  orders: [],
  hasFetchedOrders: false,
};

const orderSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    // Set all orders (replace existing)
    setOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
      state.hasFetchedOrders = true;
    },

    // Add a new order
    addOrder(state, action: PayloadAction<Order>) {
      state.orders.push(action.payload);
    },

    // Update an existing order
    updateOrder(
      state,
      action: PayloadAction<{ _id: string; updated: Partial<Order> }>
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
      action: PayloadAction<{ _id: string; status: OrderStatus }>
    ) {
      const index = state.orders.findIndex(
        (o) => o._id === action.payload._id
      );

      if (index !== -1) {
        state.orders[index].orderStatus = action.payload.status;
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

export const orderActions = orderSlice.actions;
export default orderSlice;
