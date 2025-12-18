"use client";

import { ReactNode } from "react";

// Auth checking is now handled in Header component for better stability
// This component is kept for backward compatibility but does nothing
export default function AuthChecker({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

