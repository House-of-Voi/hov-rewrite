import { type VerifyInput, type VerifyResult } from './types';
import { verifyEvm } from './evm';
import { verifyVoi } from './voi';
import { verifySolana } from './solana';

export async function verifySignature(input: VerifyInput): Promise<VerifyResult> {
  switch (input.chain) {
    case 'base': return verifyEvm(input);
    case 'voi': return verifyVoi(input);
    case 'solana': return verifySolana(input);
    default: return { ok: false, error: 'Unsupported chain' };
  }
}
