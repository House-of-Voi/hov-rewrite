/**
 * Voi Network Integration
 *
 * Export wallet service and utilities for Voi blockchain.
 */

export { VoiWalletService, createWalletService, getWalletService } from './wallet-service';
export type {
  WalletProvider,
  WalletAccount,
  TransactionToSign,
  SignedTransaction,
} from './wallet-service';
