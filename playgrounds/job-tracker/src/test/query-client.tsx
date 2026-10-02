import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One client per test: a cache that outlives a test is a test depending on
// another's data. Retries off, or a 404 assertion sits through three attempts.
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
