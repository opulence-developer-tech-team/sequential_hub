import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isAuthenticated: boolean | null; // null = unknown/checking, true = authenticated, false = not authenticated
  hasCheckedAuth: boolean; // Whether we've attempted to check auth at least once
}

const initialState: AuthState = {
  isAuthenticated: null,
  hasCheckedAuth: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStatus(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      state.hasCheckedAuth = true;
    },
    resetAuthStatus(state) {
      state.isAuthenticated = null;
      state.hasCheckedAuth = false;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice;















































