import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isEmailVerified: boolean;
  status: "active" | "pending" | "inactive";
  totalOrders?: number;
  totalSpent?: number;
  lastOrder?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminUsersState {
  users: AdminUser[];
  pagination: UsersPagination;
  hasFetchedUsers: boolean;
}

const initialState: AdminUsersState = {
  users: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  hasFetchedUsers: false,
};

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    setUsers(
      state,
      action: PayloadAction<{ users: AdminUser[]; pagination: UsersPagination }>
    ) {
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
      state.hasFetchedUsers = true;
    },
    clearUsers(state) {
      state.users = [];
      state.pagination = { ...initialState.pagination };
      state.hasFetchedUsers = false;
    },
  },
});

export const adminUsersActions = adminUsersSlice.actions;
export default adminUsersSlice;