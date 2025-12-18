import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RecentOrder {
  id: string;
  type: "regular" | "measurement";
  customerName: string;
  amount: number;
  status: string;
  paymentStatus?: string;
  category?: string;
  createdAt: string | Date;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalMeasurementOrders: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  recentOrders: RecentOrder[];
}

export interface DashboardState {
  stats: DashboardStats | null;
  hasFetchedStats: boolean;
}

const initialState: DashboardState = {
  stats: null,
  hasFetchedStats: false,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDashboardStats(state, action: PayloadAction<DashboardStats>) {
      state.stats = action.payload;
      state.hasFetchedStats = true;
    },
    clearDashboardStats(state) {
      state.stats = null;
      state.hasFetchedStats = false;
    },
  },
});

export const dashboardActions = dashboardSlice.actions;
export default dashboardSlice;
