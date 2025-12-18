"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ReactNode, useEffect } from "react";
import store, { persistor } from "@/store/redux";
import { Toaster } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { authActions } from "@/store/redux/auth/auth-slice";

interface ClientProviderProps {
  children: ReactNode;
  initialAuthState: {
    authenticated: boolean;
    userId: string | null;
    userType: string | null;
  };
}

// Component to initialize Redux with server-side auth state
function AuthInitializer({ children, initialAuthState }: ClientProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from server-side check
    dispatch(authActions.setAuthStatus(initialAuthState.authenticated));
  }, [dispatch, initialAuthState.authenticated]);

  return <>{children}</>;
}

export default function ClientProvider({
  children,
  initialAuthState,
}: ClientProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingSpinner fullScreen />}
        persistor={persistor}
      >
        <Toaster richColors position="top-right" />
        <AuthInitializer initialAuthState={initialAuthState}>
          {children}
        </AuthInitializer>
      </PersistGate>
    </Provider>
  );
}
