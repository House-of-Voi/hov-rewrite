'use client';

import { ReactNode } from 'react';
import { CDPReactProvider, type AuthMethod, type Config as CdpConfig } from '@coinbase/cdp-react';

interface CdpProviderProps {
  children: ReactNode;
}

const PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

const AUTH_METHODS: AuthMethod[] = ['email', 'sms', 'oauth:google', 'oauth:apple'];

const CDP_CONFIG: CdpConfig | null = PROJECT_ID
  ? {
      projectId: PROJECT_ID,
      appName: 'House of Voi',
      showCoinbaseFooter: false,
      authMethods: AUTH_METHODS,
      debugging: process.env.NODE_ENV !== 'production',
      ethereum: {
        createOnLogin: 'smart',
        enableSpendPermissions: true,
      },
      solana: {
        createOnLogin: false,
      },
    }
  : null;

export function CdpProvider({ children }: CdpProviderProps) {
  if (!CDP_CONFIG) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CDP project ID missing - rendering without CDP provider');
    }
    return <>{children}</>;
  }

  return <CDPReactProvider config={CDP_CONFIG}>{children}</CDPReactProvider>;
}
