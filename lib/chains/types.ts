export type ChainId = 'base' | 'voi' | 'solana';

export interface NoncePayload {
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  domain?: string;
  statement?: string;
}

export interface VerifyInput {
  chain: ChainId;
  address: string;
  signature: string;
  payload: NoncePayload;
}

export type VerifyResult =
  | { ok: true; normalizedAddress: string }
  | { ok: false; error: string };
