import { Buffer } from 'buffer';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import algosdk from 'algosdk';
import nacl from 'tweetnacl';
import { env } from '../utils/env';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface AlgorandLinkChallengePayload {
  profileId: string;
  baseAddress: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

export interface CreateChallengeResult {
  token: string;
  payload: AlgorandLinkChallengePayload;
}

export interface VerifyChallengeResult {
  ok: boolean;
  payload?: AlgorandLinkChallengePayload;
  error?: string;
}

export interface VerifyProofResult {
  ok: boolean;
  txId?: string;
  error?: string;
}

function hmacSign(data: string): string {
  return createHmac('sha256', env.SUPABASE_SERVICE_ROLE_KEY)
    .update(data)
    .digest('base64url');
}

/**
 * Generates a stateless challenge token that the browser must embed in the
 * Algorand proof transaction note field. The token is HMAC protected so the
 * backend can verify integrity without storing challenge state.
 */
export function createAlgorandLinkChallenge(
  profileId: string,
  baseAddress: string
): CreateChallengeResult {
  const issuedAt = Date.now();
  const payload: AlgorandLinkChallengePayload = {
    profileId,
    baseAddress: baseAddress.toLowerCase(),
    nonce: randomBytes(16).toString('hex'),
    issuedAt,
    expiresAt: issuedAt + CHALLENGE_TTL_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmacSign(payloadBase64);

  return {
    token: `${payloadBase64}.${signature}`,
    payload,
  };
}

/**
 * Validates a challenge token created by {@link createAlgorandLinkChallenge}
 * and returns the decoded payload when valid.
 */
export function verifyAlgorandLinkChallenge(token: string): VerifyChallengeResult {
  if (!token) {
    return { ok: false, error: 'Missing challenge token' };
  }

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return { ok: false, error: 'Malformed challenge token' };
  }

  const expectedSignature = hmacSign(payloadPart);

  const provided = Buffer.from(signaturePart, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, error: 'Invalid challenge signature' };
  }

  let payload: AlgorandLinkChallengePayload;

  try {
    const decodedJson = Buffer.from(payloadPart, 'base64url').toString('utf8');
    payload = JSON.parse(decodedJson);
  } catch {
    return { ok: false, error: 'Invalid challenge payload' };
  }

  if (!payload.profileId || !payload.baseAddress || !payload.expiresAt) {
    return { ok: false, error: 'Incomplete challenge payload' };
  }

  if (Date.now() > payload.expiresAt) {
    return { ok: false, error: 'Challenge has expired' };
  }

  return { ok: true, payload };
}

/**
 * Verifies a signed Algorand payment transaction used as proof of address
 * ownership.
 *
 * Requirements enforced:
 * - Sender matches the provided Algorand address
 * - Receiver matches the sender (self-payment)
 * - Amount is zero
 * - Note field exactly matches the challenge token
 * - Signature is valid for the encoded transaction bytes
 */
function decodeBase64OrUrl(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

export function verifyAlgorandOwnershipProof(options: {
  algorandAddress: string;
  challengeToken: string;
  signedTransaction: string;
}): VerifyProofResult {
  const { algorandAddress, challengeToken, signedTransaction } = options;

  let signedBytes: Uint8Array;
  try {
    signedBytes = decodeBase64OrUrl(signedTransaction);
  } catch (error) {
    console.error('Algorand proof decode error:', error);
    return { ok: false, error: 'Signed transaction is not valid base64' };
  }

  let decoded;

  try {
    decoded = algosdk.decodeSignedTransaction(signedBytes);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to decode transaction',
    };
  }

  if (!decoded.sig) {
    return { ok: false, error: 'Signed transaction is missing signature' };
  }

  const senderAddress = decoded.txn.sender.toString();

  if (senderAddress !== algorandAddress) {
    return { ok: false, error: 'Transaction sender does not match Algorand address' };
  }

  const payment = decoded.txn.payment;
  if (!payment) {
    return { ok: false, error: 'Proof transaction must be a payment transaction' };
  }

  if (payment.amount !== 0n) {
    return { ok: false, error: 'Proof transaction must have zero amount' };
  }

  if (payment.receiver.toString() !== algorandAddress) {
    return { ok: false, error: 'Proof transaction must be self-signed' };
  }

  const noteBytes = decoded.txn.note ?? new Uint8Array();
  const note = Buffer.from(noteBytes).toString('utf8');

  if (note !== challengeToken) {
    return { ok: false, error: 'Challenge token mismatch in transaction note' };
  }

  const txnBytes = decoded.txn.bytesToSign();
  const signatureValid = nacl.sign.detached.verify(
    txnBytes,
    decoded.sig,
    decoded.txn.sender.publicKey
  );

  if (!signatureValid) {
    return { ok: false, error: 'Invalid Algorand signature' };
  }

  return {
    ok: true,
    txId: decoded.txn.txID(),
  };
}

export { CHALLENGE_TTL_MS as ALGORAND_CHALLENGE_TTL_MS };
