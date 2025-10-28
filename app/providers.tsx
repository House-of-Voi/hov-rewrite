'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let queryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000, // 30 seconds - data fresh for this duration
          gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache even when unused
          refetchOnWindowFocus: true, // Refetch when user returns to tab
          refetchOnReconnect: true, // Refetch when connection restored
          retry: 2, // Retry failed requests twice
        },
        mutations: {
          retry: 1, // Retry mutations once on failure
        },
      },
    });
  }

  // Browser: make a single query client for the app's lifetime
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000, // 30 seconds - data fresh for this duration
          gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache even when unused
          refetchOnWindowFocus: true, // Refetch when user returns to tab
          refetchOnReconnect: true, // Refetch when connection restored
          retry: 2, // Retry failed requests twice
        },
        mutations: {
          retry: 1, // Retry mutations once on failure
        },
      },
    });
  }

  return queryClient;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const client = getQueryClient();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
