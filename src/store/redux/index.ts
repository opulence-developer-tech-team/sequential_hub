"use client";

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import clientCartReducer from "./cart/client-cart";
import cartReducer from "./cart/cart-slice";
import adminReducer from "./adminSlice";
import userDataReducer from "./user/user-data-slice";
import userWishlistReducer from "./user/user-wishlist-slice";
import userOrderReducer from "./user/order-slice";
import userMeasurementOrderReducer from "./user/measurement-order-slice";
import authReducer from "./auth/auth-slice";
import shippingSettingsReducer from "./guest/shipping-settings-slice";

// Persist configuration for client cart
const clientCartPersistConfig = {
  key: "client-cart",
  storage,
  // Persist both cart items and cart length for reliability
  // cartLength will be recalculated on rehydration via extraReducers
  whitelist: ["clientCartItems"],
  // Version for migrations (increment when state structure changes)
  version: 1,
};

// Persist configuration for user wishlist
// Note: hasFetchedWishlist is NOT persisted - it's reset to false on rehydration
// to ensure fresh data is always fetched from the server
const userWishlistPersistConfig = {
  key: "user-wishlist",
  storage,
  // Only persist the wishlist data, not hasFetchedWishlist
  // hasFetchedWishlist will be reset to false on rehydration via extraReducers
  whitelist: ["wishlist"],
  // Version for migrations (increment when state structure changes)
  version: 1,
};

// Root reducer with persistence
// Note: cart reducer is NOT persisted - it's fetched fresh from the server
// Note: auth reducer is NOT persisted - we check auth on app load
const rootReducer = combineReducers({
  clientCart: persistReducer(
    clientCartPersistConfig,
    clientCartReducer.reducer
  ),
  cart: cartReducer.reducer, // Not persisted - fetched fresh from server
  auth: authReducer.reducer, // Not persisted - checked on app load
  admin: adminReducer.reducer,
  userData: userDataReducer.reducer,
  userWishlist: persistReducer(
    userWishlistPersistConfig,
    userWishlistReducer.reducer
  ),
  userOrders: userOrderReducer.reducer, // Not persisted - fetched fresh from server
  userMeasurementOrders: userMeasurementOrderReducer.reducer, // Not persisted - fetched fresh from server
  shippingSettings: shippingSettingsReducer.reducer, // Not persisted - fetched fresh from server
});

// Configure store with production-ready settings
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore non-serializable values in persist actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // Ignore non-serializable paths in state
        ignoredPaths: ["clientCart._persist", "userWishlist._persist"],
      },
      // Disable immutable check in production for better performance
      immutableCheck: process.env.NODE_ENV !== "production",
    }),
  // Only enable DevTools in development
  devTools: process.env.NODE_ENV !== "production",
});

// Create persistor
export const persistor = persistStore(store);

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
