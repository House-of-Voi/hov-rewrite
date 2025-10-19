import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import algosdk from 'algosdk';
import nacl from 'tweetnacl';

/**
 * Domain separator to ensure keys are unique to House of Voi
 * This prevents key reuse across different applications
 */
const DOMAIN_SEPARATOR = 'house-of-voi-algorand-derivation';

/**
 * Derives a deterministic Algorand (ED25519) keypair from an EVM private key
 *
 * Uses HKDF-SHA256 to derive a 32-byte seed from the EVM private key.
 * This ensures the same EVM key always produces the same Algorand account.
 *
 * @param evmPrivateKey - The EVM private key as a hex string (with or without 0x prefix)
 * @returns Algorand account with address and secret key (Uint8Array)
 */
export function deriveAlgorandAccountFromEVM(evmPrivateKey: string): {
  address: string;
  secretKey: Uint8Array;
} {
  // Remove 0x prefix if present and convert to Uint8Array
  const cleanHex = evmPrivateKey.replace(/^0x/, '');
  const evmKeyBytes = new Uint8Array(
    cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  if (evmKeyBytes.length !== 32) {
    throw new Error('Invalid EVM private key length. Expected 32 bytes.');
  }

  // Use HKDF to derive a 32-byte seed for ED25519
  // info parameter includes domain separator for key isolation
  const algorandSeed = hkdf(
    sha256,
    evmKeyBytes,
    undefined, // salt (optional)
    DOMAIN_SEPARATOR,
    32 // output length (ED25519 seed size)
  );

  // Generate Algorand keypair from the derived seed
  const keypair = nacl.sign.keyPair.fromSeed(algorandSeed);

  return {
    address: algosdk.encodeAddress(keypair.publicKey),
    secretKey: keypair.secretKey,
  };
}

/**
 * Derives just the Algorand address from an EVM private key
 * Useful when you only need the address without the secret key
 *
 * @param evmPrivateKey - The EVM private key as a hex string
 * @returns Algorand address string
 */
export function deriveAlgorandAddressFromEVM(evmPrivateKey: string): string {
  const account = deriveAlgorandAccountFromEVM(evmPrivateKey);
  return account.address;
}

/**
 * Validates that an Algorand address is valid
 *
 * @param address - Algorand address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAlgorandAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}
