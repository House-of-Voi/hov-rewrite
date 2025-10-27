'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useSignInWithEmail,
  useVerifyEmailOTP,
  useSignInWithSms,
  useVerifySmsOTP,
  useSignInWithOAuth,
  useCurrentUser,
  useGetAccessToken,
  useExportEvmAccount,
  useEvmAddress,
  type OAuth2ProviderType,
  type User
} from '@coinbase/cdp-hooks';
import Card, { CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import algosdk from 'algosdk';
import { buildProofOfOwnershipTransaction } from '@/lib/chains/algorand-browser';
import { deriveAlgorandAccountFromEVM } from '@/lib/chains/algorand-derive';

const E164_PHONE_REGEX = /^\+\d{8,15}$/;

function normalizeE164Phone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, '');

  if (!digitsOnly) {
    return null;
  }

  let normalizedDigits = digitsOnly;

  if (trimmed.startsWith('+')) {
    // Already includes a plus; ensure it falls within valid length.
    if (normalizedDigits.length < 8 || normalizedDigits.length > 15) {
      return null;
    }
    return `+${normalizedDigits}`;
  }

  if (normalizedDigits.length === 11 && normalizedDigits.startsWith('1')) {
    // Already includes the US country code prefix.
  } else if (normalizedDigits.length === 10) {
    normalizedDigits = `1${normalizedDigits}`;
  } else {
    // Unable to infer country code reliably
    return null;
  }

  const normalized = `+${normalizedDigits}`;
  return E164_PHONE_REGEX.test(normalized) ? normalized : null;
}

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [flowId, setFlowId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'sms' | 'oauth' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [oauthProcessed, setOauthProcessed] = useState(false);
  const [inputMode, setInputMode] = useState<'email' | 'phone'>('email');
  const router = useRouter();

  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signInWithSms } = useSignInWithSms();
  const { verifySmsOTP } = useVerifySmsOTP();
  const { signInWithOAuth, oauthState } = useSignInWithOAuth();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();
  const { exportEvmAccount } = useExportEvmAccount();
  const { evmAddress } = useEvmAddress();

  /**
   * Handles email authentication flow
   */
  async function handleEmailAuth() {
    if (!email) {
      setStatus('Please enter your email address');
      return;
    }

    setLoading(true);
    setStatus('Sending verification code to your email...');

    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setAuthMethod('email');
      setOtpSent(true);
      setStatus('Check your email for the verification code');
    } catch (error) {
      console.error('Email auth error:', error);
      setStatus('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles SMS authentication flow
   */
  async function handleSmsAuth() {
    if (!phone) {
      setStatus('Please enter your phone number');
      return;
    }

    const normalizedPhone = normalizeE164Phone(phone);

    if (!normalizedPhone) {
      setStatus('Please enter a valid phone number (10 digits for US numbers or full international format).');
      return;
    }

    setLoading(true);
    setStatus('Sending verification code to your phone...');

    try {
      const result = await signInWithSms({ phoneNumber: normalizedPhone });
      setFlowId(result.flowId);
      setAuthMethod('sms');
      setOtpSent(true);
      setPhone(normalizedPhone);
      setStatus('Check your phone for the verification code');
    } catch (error) {
      console.error('SMS auth error:', error);
      setStatus('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Verifies OTP and completes authentication
   */
  async function handleVerifyOtp() {
    if (!otpCode || !flowId || !authMethod) {
      setStatus('Please enter the verification code');
      return;
    }

    setLoading(true);
    setStatus('Verifying code...');

    try {
      let user;

      // Verify based on auth method
      if (authMethod === 'email') {
        const result = await verifyEmailOTP({ otp: otpCode, flowId });
        user = result.user;
      } else if (authMethod === 'sms') {
        const result = await verifySmsOTP({ otp: otpCode, flowId });
        user = result.user;
      } else {
        throw new Error('Invalid authentication method');
      }

      setStatus('Authentication successful! Setting up your account...');

      // Complete backend session creation
      await completeAuthentication(user);
    } catch (error) {
      console.error('OTP verification error:', error);
      setStatus('Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles social login (Google, Apple, etc.)
   */
  async function handleSocialLogin(provider: OAuth2ProviderType) {
    setLoading(true);
    setStatus(`Connecting to ${provider}...`);

    try {
      await signInWithOAuth(provider);
      // OAuth flow will redirect and come back with user authenticated
    } catch (error) {
      console.error('Social login error:', error);
      setStatus(`Failed to connect with ${provider}. Please try again.`);
      setLoading(false);
    }
  }

  const completeAuthentication = useCallback(async (user: User) => {
    setLoading(true);
    setStatus('Verifying your Coinbase session...');

    async function linkAlgorandWallet({
      serverBaseAddress,
      walletAddress,
    }: {
      serverBaseAddress: string;
      walletAddress: string;
    }) {
      const candidateAccounts = Array.from(
        new Set(
          [walletAddress, serverBaseAddress, evmAddress]
            .filter(
              (value): value is string => typeof value === 'string' && value.length > 0
            )
            .flatMap((value) => {
              const normalized = value.toLowerCase();
              return normalized === value ? [value] : [value, normalized];
            })
        )
      );

      if (candidateAccounts.length === 0) {
        throw new Error('Unable to determine your Base wallet address for export.');
      }

      setStatus('Exporting your embedded Base wallet key...');
      let exportedPrivateKey: string | null = null;
      for (const candidate of candidateAccounts) {
        try {
          const { privateKey } = await exportEvmAccount({ evmAccount: candidate as `0x${string}` });
          if (privateKey) {
            exportedPrivateKey = privateKey;
            break;
          }
        } catch (error) {
          console.warn('Failed to export Base key for address', candidate, error);
        }
      }

      if (!exportedPrivateKey) {
        throw new Error(
          'Failed to export Base private key from Coinbase. Please approve the export prompt and try again.'
        );
      }

      setStatus('Deriving your Algorand wallet locally...');
      const derivedAccount = deriveAlgorandAccountFromEVM(exportedPrivateKey);

      // Best-effort cleanup of EVM private key string
      exportedPrivateKey = '';

      setStatus('Requesting ownership challenge...');
      const challengeResponse = await fetch('/api/auth/algorand/challenge', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      if (!challengeResponse) {
        throw new Error('Failed to contact Algorand challenge endpoint.');
      }

      const challengeResult = await challengeResponse.json();

      if (!challengeResponse.ok || !challengeResult.challenge) {
        throw new Error(challengeResult.error || 'Failed to obtain Algorand challenge.');
      }
      const { challenge, baseAddress: challengeBaseAddress } = challengeResult;
      const normalizedBase = serverBaseAddress.toLowerCase();

      if (
        typeof challengeBaseAddress === 'string' &&
        challengeBaseAddress.toLowerCase() !== normalizedBase
      ) {
        throw new Error('Challenge response did not match your Base wallet address.');
      }

      setStatus('Signing Algorand ownership proof...');
      const proofTxn = buildProofOfOwnershipTransaction(derivedAccount.address, challenge);
      const signedTxn = algosdk.signTransaction(proofTxn, derivedAccount.secretKey);
      const signedTxnBase64 = algosdk.bytesToBase64(signedTxn.blob);

      // Overwrite the secret key in memory after signing
      derivedAccount.secretKey.fill(0);

      setStatus('Linking Algorand wallet to your profile...');
      const linkResponse = await fetch('/api/auth/algorand/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorandAddress: derivedAccount.address,
          signedTransaction: signedTxnBase64,
          challenge,
        }),
      });

      const linkResult = await linkResponse.json();

      if (!linkResponse.ok || !linkResult.ok) {
        throw new Error(linkResult.error || 'Failed to verify Algorand ownership.');
      }
    }

    try {
      const walletAddress = user.evmAccounts?.[0];

      if (!walletAddress) {
        throw new Error('No Coinbase EVM account found for this user.');
      }

      let accessToken: string | null = null;
      try {
        accessToken = await getAccessToken();
      } catch (error) {
        console.error('Failed to fetch CDP access token:', error);
      }

      if (!accessToken) {
        throw new Error('Unable to retrieve Coinbase session token. Please try signing in again.');
      }

      const verifyResponse = await fetch('/api/auth/coinbase-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          cdpUserId:
            user.userId || (user as unknown as { id?: string }).id || undefined,
          walletAddress,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult.ok) {
        throw new Error(verifyResult.error || 'Failed to verify Coinbase authentication.');
      }

      const baseAddress: string | undefined = verifyResult.baseWalletAddress;

      if (!baseAddress) {
        throw new Error('Backend did not return a Base wallet address.');
      }

      if (!verifyResult.hasLinkedAlgorand) {
        await linkAlgorandWallet({
          serverBaseAddress: baseAddress,
          walletAddress,
        });
      }

      setStatus('Success! Redirecting to your dashboard...');

      // Emit login success event for UserNav to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hov:login-success'));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/app');
    } catch (error) {
      console.error('Complete auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete authentication. Please try again.';

      // If token expired, clear state and prompt for re-auth
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid or expired CDP')) {
        setStatus('Session expired. Please sign in again.');
        setOtpSent(false);
        setOtpCode('');
        setEmail('');
        setPhone('');
        setAuthMethod(null);
        setOauthProcessed(false);
        // Clear any stale cookies
        document.cookie = 'hov_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } else {
        setStatus(errorMessage);
      }

      setLoading(false);
    }
  }, [exportEvmAccount, evmAddress, getAccessToken, router]);

  // Handle existing CDP sessions (OAuth or returning users)
  useEffect(() => {
    if (currentUser && !oauthProcessed && !loading) {
      setOauthProcessed(true);
      setStatus('Restoring your session...');

      // Determine auth method from OAuth state or default to email
      const method = oauthState?.status === 'success' ? 'oauth' : 'email';
      setAuthMethod(method);

      completeAuthentication(currentUser);
    }
  }, [oauthState, currentUser, oauthProcessed, loading, completeAuthentication]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-warning-500 dark:text-warning-400 neon-text uppercase">
            Welcome
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sign in or create your account
          </p>
        </div>

        {/* Status Display */}
        {status && (
          <div className={`p-4 rounded-xl text-center font-semibold ${
            status.includes('Success')
              ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400 border border-success-300 dark:border-success-500/30'
              : status.includes('Error') || status.includes('failed') || status.includes('Failed')
              ? 'bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-400 border border-error-300 dark:border-error-500/30'
              : 'bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 border border-warning-300 dark:border-warning-500/30'
          }`}>
            {status}
          </div>
        )}

        {/* Main Auth Card */}
        <Card glow>
          <CardContent className="p-8">
            {!otpSent ? (
              <div className="space-y-6">
                {/* Social Login First (Most friction-free) */}
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading}
                    className="w-full text-base py-3"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-warning-200 dark:border-warning-900/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-500">or</span>
                  </div>
                </div>

                {/* Email/Phone Inputs */}
                <div className="space-y-4">
                  {inputMode === 'email' ? (
                    <>
                      <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && email) handleEmailAuth();
                        }}
                      />

                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleEmailAuth}
                        disabled={loading || !email}
                        className="w-full"
                      >
                        Continue with Email
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && phone) handleSmsAuth();
                        }}
                      />
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSmsAuth}
                        disabled={loading || !phone}
                        className="w-full"
                      >
                        Continue with Phone
                      </Button>
                    </>
                  )}

                  {/* Toggle between email and phone */}
                  <button
                    onClick={() => setInputMode(inputMode === 'email' ? 'phone' : 'email')}
                    disabled={loading}
                    className="w-full text-center text-sm text-neutral-600 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 underline"
                  >
                    {inputMode === 'email' ? 'Use phone number instead' : 'Use email instead'}
                  </button>
                </div>
              </div>
            ) : (
              /* OTP Verification */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl mb-4">📧</div>
                  <h2 className="text-xl font-bold text-warning-500 dark:text-warning-400">Check your {authMethod === 'email' ? 'email' : 'phone'}</h2>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    We sent a verification code to
                  </p>
                  <p className="text-warning-500 dark:text-warning-400 font-semibold">
                    {authMethod === 'email' ? email : phone}
                  </p>
                </div>

                <Input
                  label="Verification Code"
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otpCode.length === 6) handleVerifyOtp();
                  }}
                />

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full"
                >
                  Verify & Continue
                </Button>

                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setStatus(null);
                  }}
                  disabled={loading}
                  className="w-full text-center text-sm text-neutral-600 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 underline"
                >
                  ← Use a different method
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="text-center text-xs text-neutral-600 dark:text-neutral-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
