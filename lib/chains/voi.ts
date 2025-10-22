import { VerifyInput, VerifyResult } from './types';
import algosdk from 'algosdk';

/**
 * Verifies an ED25519 signature for Voi (Algorand-based) addresses
 *
 * Voi uses the same cryptographic primitives as Algorand (ED25519).
 * The signature verification works by:
 * 1. Decoding the base64-encoded signature
 * 2. Converting the message to bytes
 * 3. Verifying the signature against the public key derived from the address
 *
 * @param input - Contains address, signature, and payload to verify
 * @returns VerifyResult with success status and normalized address
 */
export async function verifyVoi(input: VerifyInput): Promise<VerifyResult> {
  try {
    const { address, signature, payload } = input;

    // Validate Algorand/Voi address format
    if (!algosdk.isValidAddress(address)) {
      return { ok: false, error: 'Invalid Voi address format' };
    }

    // Construct the message that was signed
    // This should match the format used when creating the signature
    const message = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

    const messageBytes = new TextEncoder().encode(message);

    // Decode the signature from base64 or hex
    let signatureBytes: Uint8Array;
    try {
      // Try base64 first (standard for Algorand SDK)
      signatureBytes = Buffer.from(signature, 'base64');
      if (signatureBytes.length !== 64) {
        // If not 64 bytes, try hex
        signatureBytes = Buffer.from(signature, 'hex');
      }
    } catch {
      return { ok: false, error: 'Invalid signature encoding' };
    }

    if (signatureBytes.length !== 64) {
      return { ok: false, error: 'Invalid signature length (expected 64 bytes)' };
    }

    // Verify the signature using the address directly (algosdk 3.x accepts address string)
    const isValid = algosdk.verifyBytes(messageBytes, signatureBytes, address);

    if (!isValid) {
      return { ok: false, error: 'Signature verification failed' };
    }

    // Return success with normalized address
    return {
      ok: true,
      normalizedAddress: address,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}
