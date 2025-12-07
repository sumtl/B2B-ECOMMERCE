"use client";

import { ClerkProvider, StripeProvider } from "@/components/providers";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <StripeProvider>
        {children}
      </StripeProvider>
    </ClerkProvider>
  );
}
