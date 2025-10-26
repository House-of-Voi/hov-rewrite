import { CdpClient } from '@coinbase/cdp-sdk';
import type { JWTPayload } from 'jose';
import { env } from '../utils/env';

/**
 * CDP End User information returned after successful token validation
 */
export interface CdpEndUser {
  userId: string;
  email?: string;
  phoneNumber?: string;
  walletAddress: string;
  authMethod: 'email' | 'phone' | 'social';
}

let cachedCdpClient: CdpClient | null = null;

type AuthMethodPayload = JWTPayload & {
  email?: string;
  phone_number?: string;
  social_provider?: string;
  wallet_address?: string;
};

function getCdpClient(): CdpClient {
  if (!cachedCdpClient) {
    try {
      cachedCdpClient = new CdpClient({
        apiKeyId: env.NEXT_PUBLIC_CDP_API_KEY_NAME,
        apiKeySecret: env.CDP_API_KEY_PRIVATE_KEY,
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize CDP SDK client: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
  return cachedCdpClient;
}

function extractAuthFromMethods(methods: unknown): {
  email?: string;
  phoneNumber?: string;
  authMethod: 'email' | 'phone' | 'social';
} {
  if (!Array.isArray(methods)) {
    return { authMethod: 'email' };
  }

  for (const method of methods) {
    if (!method || typeof method !== 'object') continue;
    const { type } = method as { type?: string };

    if (typeof (method as { email?: unknown }).email === 'string') {
      const email = (method as { email: string }).email;
      const authMethod: 'email' | 'phone' | 'social' =
        type === 'jwt' ? 'social' : 'email';
      return { email, authMethod };
    }

    if (typeof (method as { phoneNumber?: unknown }).phoneNumber === 'string') {
      const phoneNumber = (method as { phoneNumber: string }).phoneNumber;
      const authMethod: 'email' | 'phone' | 'social' =
        type === 'jwt' ? 'social' : 'phone';
      return { phoneNumber, authMethod };
    }

    if (type === 'jwt') {
      return { authMethod: 'social' };
    }
  }

  return { authMethod: 'email' };
}

function normalizeEndUserResponse(endUser: unknown): CdpEndUser {
  if (!endUser || typeof endUser !== 'object') {
    throw new Error('Invalid end user payload from CDP');
  }

  const userId = (endUser as { userId?: string }).userId;
  if (!userId) {
    throw new Error('CDP end user payload missing userId');
  }

  const evmAccounts = (endUser as { evmAccounts?: string[] }).evmAccounts ?? [];

  const { email: methodEmail, phoneNumber: methodPhone, authMethod } = extractAuthFromMethods(
    (endUser as { authenticationMethods?: unknown }).authenticationMethods
  );

  const walletAddressSource =
    evmAccounts[0] ??
    (endUser as { walletAddress?: string }).walletAddress;

  if (!walletAddressSource) {
    throw new Error('CDP end user payload missing wallet address');
  }
  const walletAddress = walletAddressSource.toLowerCase();

  const topLevelEmail =
    typeof (endUser as { email?: unknown }).email === 'string'
      ? ((endUser as { email: string }).email ?? undefined)
      : undefined;
  const topLevelPhone =
    typeof (endUser as { phoneNumber?: unknown }).phoneNumber === 'string'
      ? ((endUser as { phoneNumber: string }).phoneNumber ?? undefined)
      : undefined;

  const rawEmail = methodEmail ?? topLevelEmail;
  const rawPhone = methodPhone ?? topLevelPhone;

  const normalizedEmail =
    typeof rawEmail === 'string' && rawEmail.trim().length > 0
      ? rawEmail.trim().toLowerCase()
      : undefined;
  const normalizedPhone =
    typeof rawPhone === 'string' && rawPhone.trim().length > 0
      ? rawPhone.trim()
      : undefined;

  return {
    userId,
    email: normalizedEmail,
    phoneNumber: normalizedPhone,
    walletAddress,
    authMethod,
  };
}

/**
 * Validates a CDP access token by calling CDP's backend API
 *
 * This function validates the access token issued by Coinbase CDP Embedded Wallets.
 * It communicates with CDP's validation endpoint to verify the token is:
 * 1. Authentic (signed by Coinbase)
 * 2. Not expired
 * 3. Associated with a valid end user
 *
 * @param accessToken - The CDP access token from the client
 * @param options - Validation options (timeout, retry)
 * @returns CdpEndUser information if valid
 * @throws Error if token is invalid, expired, or validation fails
 */
export async function validateCdpAccessToken(
  accessToken: string,
  options?: { timeout?: number; retries?: number }
): Promise<CdpEndUser> {
  const timeout = options?.timeout ?? 5000; // 5 second default timeout
  const retries = options?.retries ?? 0; // No retries by default

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const client = getCdpClient();

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('CDP validation timeout')), timeout);
      });

      // Race between validation and timeout
      const validationPromise = client.endUser.validateAccessToken({ accessToken });
      const endUser = await Promise.race([validationPromise, timeoutPromise]);

      return normalizeEndUserResponse(endUser);
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log retry attempts
      if (!isLastAttempt) {
        console.warn(`CDP validation attempt ${attempt + 1} failed: ${errorMessage}. Retrying...`);
        // Wait briefly before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }

      // On final attempt, throw the error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during CDP token validation');
    }
  }

  throw new Error('CDP validation failed after all retries');
}

/**
 * Determines the authentication method used by the end user
 */
function determineAuthMethod(userData: AuthMethodPayload): 'email' | 'phone' | 'social' {
  if (userData.email && !userData.social_provider) return 'email';
  if (userData.phone_number) return 'phone';
  if (userData.social_provider) return 'social';
  return 'email'; // default fallback
}

/**
 * Validates a CDP access token using JWT verification (alternative approach)
 *
 * This method verifies the JWT signature using CDP's public JWKS endpoint.
 * This is more efficient than API calls but requires proper JWKS setup.
 *
 * @param accessToken - The CDP JWT access token
 * @returns Decoded JWT payload with user information
 */
export async function validateCdpTokenJwks(accessToken: string): Promise<CdpEndUser> {
  try {
    const { jwtVerify, createRemoteJWKSet } = await import('jose');

    // CDP's JWKS endpoint (public keys for JWT verification)
    const JWKS_URL = 'https://api.cdp.coinbase.com/.well-known/jwks.json';
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

    // Verify the JWT signature
    const { payload } = await jwtVerify(accessToken, JWKS, {
      issuer: 'https://api.cdp.coinbase.com', // Expected issuer
      audience: env.NEXT_PUBLIC_CDP_PROJECT_ID, // Your project ID
    });

    // Extract user information from JWT claims
    const walletClaim =
      typeof payload.wallet_address === 'string' ? payload.wallet_address.toLowerCase() : '';

    return {
      userId: payload.sub || '',
      email: payload.email as string | undefined,
      phoneNumber: payload.phone_number as string | undefined,
      walletAddress: walletClaim,
      authMethod: determineAuthMethod(payload as AuthMethodPayload),
    };
  } catch (error) {
    throw new Error(
      `CDP JWT validation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Checks if an error indicates that a token has expired
 */
function isTokenExpiredError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('expired') || message.includes('exp');
  }
  return false;
}

/**
 * Validates CDP access token with fallback strategy
 *
 * CDP access tokens are JWTs that can be verified using JWKS.
 * We try JWKS validation first, then fall back to API validation if needed.
 *
 * @param accessToken - The CDP access token
 * @param options - Validation options (timeout, retries)
 * @returns CdpEndUser information, or null if token is expired
 * @throws Error if token validation fails for other reasons
 */
export async function validateCdpToken(
  accessToken: string,
  options?: { timeout?: number; retries?: number }
): Promise<CdpEndUser | null> {
  // Prefer the official API validation (requires CDP API key and ensures latest claims)
  try {
    return await validateCdpAccessToken(accessToken, options);
  } catch (apiError) {
    // If API validation failed due to expired token, don't bother with JWKS
    if (isTokenExpiredError(apiError)) {
      console.warn('CDP token has expired');
      return null;
    }

    const apiMessage = apiError instanceof Error ? apiError.message : 'Unknown error';

    // Only try JWKS fallback if API call itself failed (not auth failure)
    const isNetworkError = apiMessage.includes('timeout') ||
                          apiMessage.includes('network') ||
                          apiMessage.includes('fetch');

    if (!isNetworkError) {
      console.warn('CDP API validation failed with non-network error:', apiMessage);
      return null;
    }

    console.warn('CDP API validation timed out, trying JWKS validation');

    // Fallback to JWKS validation (works for JWT-form tokens without API access)
    try {
      return await validateCdpTokenJwks(accessToken);
    } catch (jwksError) {
      // Check if JWKS error is also an expiration error
      if (isTokenExpiredError(jwksError)) {
        console.warn('CDP token has expired');
        return null;
      }

      // Both methods failed
      const jwksMessage =
        jwksError instanceof Error ? jwksError.message : 'Unknown JWKS validation error';

      throw new Error(
        `CDP token validation failed. API error: ${apiMessage}. JWKS error: ${jwksMessage}`
      );
    }
  }
}
