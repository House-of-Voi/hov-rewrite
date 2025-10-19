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
    normalizedDigits = normalizedDigits;
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
  const [referralCode, setReferralCode] = useState('');
  const [flowId, setFlowId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'sms' | 'oauth' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [oauthProcessed, setOauthProcessed] = useState(false);
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
        const result = await verifyEmailOTP({ email, otp: otpCode, flowId });
        user = result.user;
      } else if (authMethod === 'sms') {
        const result = await verifySmsOTP({ phoneNumber: phone, otp: otpCode, flowId });
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
          const { privateKey } = await exportEvmAccount({ evmAccount: candidate });
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
          referralCode: referralCode || undefined,
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/app');
    } catch (error) {
      console.error('Complete auth error:', error);
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to complete authentication. Please try again.'
      );
      setLoading(false);
    }
  }, [exportEvmAccount, evmAddress, getAccessToken, router]);

  // Load referral code from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const refCookie = cookies.find(c => c.trim().startsWith('hov_ref='));
    if (refCookie) {
      const code = refCookie.split('=')[1];
      setReferralCode(code.toUpperCase());
    }
  }, []);

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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-black text-gold-400 neon-text uppercase">
          Sign In
        </h1>
        <p className="text-neutral-400 text-lg">
          Login with Email, Phone, or Social Account
        </p>
      </div>

      {/* Status Display - Shown at top when active */}
      {status && (
        <div className={`p-6 rounded-xl text-center font-semibold text-lg ${
          status.includes('Success')
            ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
            : status.includes('Error') || status.includes('failed') || status.includes('Failed')
            ? 'bg-ruby-500/20 text-ruby-400 border-2 border-ruby-500/30'
            : 'bg-gold-500/20 text-gold-400 border-2 border-gold-500/30'
        }`}>
          {status}
        </div>
      )}

      {/* Hide all forms when loading/processing */}
      {!loading && !otpSent ? (
        <>
          {/* Referral Code (Required) */}
          <Card glow>
            <CardContent className="space-y-4">
              <Input
                label="Referral Code (Required)"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXX"
                maxLength={7}
              />
              {referralCode && (
                <p className="text-sm text-neutral-400">
                  {referralCode.length === 7
                    ? '✓ Code format valid'
                    : `${7 - referralCode.length} characters remaining`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Email Authentication */}
          <Card glow>
            <CardContent className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleEmailAuth}
                disabled={loading || !email || referralCode.length !== 7}
                className="w-full"
              >
                Continue with Email
              </Button>
            </CardContent>
          </Card>

          {/* Phone Authentication */}
          <Card glow>
            <CardContent className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-123-4567"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleSmsAuth}
                disabled={loading || !phone || referralCode.length !== 7}
                className="w-full"
              >
                Continue with Phone
              </Button>
            </CardContent>
          </Card>

          {/* Social Login Options */}
          <Card glow>
            <CardContent className="space-y-3">
              <p className="text-neutral-400 text-sm text-center mb-2">
                Or sign in with
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleSocialLogin('google')}
                disabled={loading || referralCode.length !== 7}
                className="w-full"
              >
                Continue with Google
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleSocialLogin('apple')}
                disabled={loading || referralCode.length !== 7}
                className="w-full"
              >
                Continue with Apple
              </Button>
            </CardContent>
          </Card>
        </>
      ) : !loading && otpSent ? (
        /* OTP Verification */
        <Card glow>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-neutral-300">
                We sent a verification code to:
              </p>
              <p className="text-gold-400 font-semibold">
                {authMethod === 'email' ? email : phone}
              </p>
            </div>
            <Input
              label="Verification Code"
              type="text"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleVerifyOtp}
              disabled={loading || !otpCode}
              className="w-full"
            >
              Verify & Continue
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOtpSent(false);
                setOtpCode('');
                setStatus(null);
              }}
              disabled={loading}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
