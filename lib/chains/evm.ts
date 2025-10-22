import { VerifyInput, VerifyResult } from './types';
import { recoverAddress, hashMessage, isAddress, getAddress } from 'viem';

export async function verifyEvm({ address, signature, payload }: VerifyInput): Promise<VerifyResult> {
  try {
    const message = buildMessage(payload);
    const messageHash = hashMessage(message);
    const recovered = await recoverAddress({ hash: messageHash, signature: signature as `0x${string}` });
    const matches = isAddress(address) && getAddress(address) === getAddress(recovered);
    return matches
      ? { ok: true, normalizedAddress: getAddress(address) }
      : { ok: false, error: 'Signature mismatch' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return { ok: false, error: message };
  }
}

function buildMessage(p: VerifyInput['payload']): string {
  return [
    'House of Voi Sign-In',
    p.statement ?? 'Authenticate to House of Voi.',
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
    `Expires At: ${p.expiresAt}`,
    p.domain ? `Domain: ${p.domain}` : undefined,
  ].filter(Boolean).join('\n');
}
