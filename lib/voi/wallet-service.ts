/**
 * Voi Wallet Service
 *
 * Handles wallet connection, transaction signing, and account management for Voi network.
 */

import algosdk from 'algosdk';

type KibisisProvider = {
  enable(): Promise<{ accounts?: string[] }>;
  signTxns(
    requests: Array<{
      txn: string;
      signers?: string[];
      message?: string;
    }>
  ): Promise<string[]>;
};

type PeraWalletClient = {
  connect(): Promise<string[]>;
  signTransaction(
    txnGroups: Array<Array<{ txn: algosdk.Transaction; signers?: string[] }>>
  ): Promise<Uint8Array[]>;
};

type PeraWalletConstructor = new () => PeraWalletClient;

type DeflyWalletClient = {
  connect(): Promise<string[]>;
  signTransaction(
    txnGroups: Array<Array<{ txn: algosdk.Transaction; signers?: string[] }>>
  ): Promise<Uint8Array[]>;
};

type DeflyWalletConstructor = new () => DeflyWalletClient;

type ExodusAlgorandProvider = {
  connect(): Promise<string[]>;
  signTransaction(txns: Uint8Array[]): Promise<Uint8Array[]>;
};

type WalletWindow = Window & {
  algorand?: KibisisProvider;
  PeraWallet?: PeraWalletConstructor;
  DeflyWallet?: DeflyWalletConstructor;
  exodus?: {
    algorand?: ExodusAlgorandProvider;
  };
};

/**
 * Wallet provider types
 */
export type WalletProvider = 'kibisis' | 'pera' | 'defly' | 'exodus' | 'custom';

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: string;
  provider: WalletProvider;
  publicKey: Uint8Array;
}

/**
 * Transaction to sign
 */
export interface TransactionToSign {
  txn: algosdk.Transaction;
  signers?: string[];
  message?: string;
}

/**
 * Signed transaction result
 */
export interface SignedTransaction {
  txn: algosdk.Transaction;
  blob: Uint8Array;
  txID: string;
}

/**
 * Voi Wallet Service
 */
export class VoiWalletService {
  private account: WalletAccount | null = null;
  private provider: WalletProvider | null = null;

  /**
   * Connect to wallet
   */
  async connect(provider: WalletProvider = 'kibisis'): Promise<WalletAccount> {
    this.provider = provider;

    // Check if wallet extension is available
    if (!this.isWalletAvailable(provider)) {
      throw new Error(`${provider} wallet not found. Please install the extension.`);
    }

    try {
      const accounts = await this.requestAccounts(provider);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      // Use first account
      const address = accounts[0];

      this.account = {
        address,
        provider,
        publicKey: algosdk.decodeAddress(address).publicKey,
      };

      console.log(`✓ Connected to ${provider} wallet:`, address);

      return this.account;
    } catch (error) {
      throw new Error(
        `Failed to connect to ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.account = null;
    this.provider = null;
    console.log('✓ Wallet disconnected');
  }

  /**
   * Get current account
   */
  getAccount(): WalletAccount | null {
    return this.account;
  }

  /**
   * Get account address
   */
  getAddress(): string | null {
    return this.account?.address || null;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.account !== null;
  }

  /**
   * Sign transaction
   */
  async signTransaction(txn: algosdk.Transaction): Promise<SignedTransaction> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    if (!this.provider) {
      throw new Error('No wallet provider');
    }

    try {
      const txnToSign: TransactionToSign = {
        txn,
        signers: [this.account.address],
      };

      const signedTxn = await this.requestSignature(this.provider, [txnToSign]);

      if (!signedTxn || signedTxn.length === 0) {
        throw new Error('No signed transaction returned');
      }

      const blob = signedTxn[0];
      const decodedTxn = algosdk.decodeSignedTransaction(blob);

      return {
        txn: decodedTxn.txn,
        blob,
        txID: decodedTxn.txn.txID(),
      };
    } catch (error) {
      throw new Error(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sign multiple transactions (atomic transaction)
   */
  async signTransactions(txns: algosdk.Transaction[]): Promise<SignedTransaction[]> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    if (!this.provider) {
      throw new Error('No wallet provider');
    }

    try {
      const txnsToSign: TransactionToSign[] = txns.map((txn) => ({
        txn,
        signers: [this.account!.address],
      }));

      const signedTxns = await this.requestSignature(this.provider, txnsToSign);

      return signedTxns.map((blob) => {
        const decodedTxn = algosdk.decodeSignedTransaction(blob);
        return {
          txn: decodedTxn.txn,
          blob,
          txID: decodedTxn.txn.txID(),
        };
      });
    } catch (error) {
      throw new Error(
        `Failed to sign transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================================================
  // WALLET PROVIDER SPECIFIC IMPLEMENTATIONS
  // ============================================================================

  private getWalletWindow(): WalletWindow | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window as WalletWindow;
  }

  /**
   * Check if wallet is available
   */
  private isWalletAvailable(provider: WalletProvider): boolean {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow) {
      return false;
    }

    switch (provider) {
      case 'kibisis':
        return !!walletWindow.algorand;
      case 'pera':
        return !!walletWindow.PeraWallet;
      case 'defly':
        return !!walletWindow.DeflyWallet;
      case 'exodus':
        return !!walletWindow.exodus?.algorand;
      default:
        return false;
    }
  }

  /**
   * Request accounts from wallet
   */
  private async requestAccounts(provider: WalletProvider): Promise<string[]> {
    switch (provider) {
      case 'kibisis':
        return await this.requestAccountsKibisis();
      case 'pera':
        return await this.requestAccountsPera();
      case 'defly':
        return await this.requestAccountsDefly();
      case 'exodus':
        return await this.requestAccountsExodus();
      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }
  }

  /**
   * Request signature from wallet
   */
  private async requestSignature(
    provider: WalletProvider,
    txns: TransactionToSign[]
  ): Promise<Uint8Array[]> {
    switch (provider) {
      case 'kibisis':
        return await this.requestSignatureKibisis(txns);
      case 'pera':
        return await this.requestSignaturePera(txns);
      case 'defly':
        return await this.requestSignatureDefly(txns);
      case 'exodus':
        return await this.requestSignatureExodus(txns);
      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }
  }

  // Kibisis implementation
  private async requestAccountsKibisis(): Promise<string[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.algorand) {
      throw new Error('Kibisis wallet is not available');
    }

    const algorand = walletWindow.algorand;
    const result = await algorand.enable();
    return result.accounts || [];
  }

  private async requestSignatureKibisis(txns: TransactionToSign[]): Promise<Uint8Array[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.algorand) {
      throw new Error('Kibisis wallet is not available');
    }

    const algorand = walletWindow.algorand;

    // Encode transactions
    const encodedTxns = txns.map((t) => ({
      txn: Buffer.from(algosdk.encodeUnsignedTransaction(t.txn)).toString('base64'),
      signers: t.signers,
      message: t.message,
    }));

    const result = await algorand.signTxns(encodedTxns);

    // Decode signed transactions
    return result.map((signedTxn: string) => {
      return new Uint8Array(Buffer.from(signedTxn, 'base64'));
    });
  }

  // Pera Wallet implementation
  private async requestAccountsPera(): Promise<string[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.PeraWallet) {
      throw new Error('Pera wallet is not available');
    }

    const PeraWallet = walletWindow.PeraWallet;
    const peraWallet = new PeraWallet();

    const accounts = await peraWallet.connect();
    return accounts;
  }

  private async requestSignaturePera(txns: TransactionToSign[]): Promise<Uint8Array[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.PeraWallet) {
      throw new Error('Pera wallet is not available');
    }

    const PeraWallet = walletWindow.PeraWallet;
    const peraWallet = new PeraWallet();

    const txnGroups = txns.map((t) => ({ txn: t.txn, signers: t.signers }));
    const signedTxns = await peraWallet.signTransaction([txnGroups]);

    return signedTxns;
  }

  // Defly Wallet implementation
  private async requestAccountsDefly(): Promise<string[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.DeflyWallet) {
      throw new Error('Defly wallet is not available');
    }

    const DeflyWallet = walletWindow.DeflyWallet;
    const deflyWallet = new DeflyWallet();

    const accounts = await deflyWallet.connect();
    return accounts;
  }

  private async requestSignatureDefly(txns: TransactionToSign[]): Promise<Uint8Array[]> {
    const walletWindow = this.getWalletWindow();
    if (!walletWindow?.DeflyWallet) {
      throw new Error('Defly wallet is not available');
    }

    const DeflyWallet = walletWindow.DeflyWallet;
    const deflyWallet = new DeflyWallet();

    const txnGroups = txns.map((t) => ({ txn: t.txn, signers: t.signers }));
    const signedTxns = await deflyWallet.signTransaction([txnGroups]);

    return signedTxns;
  }

  // Exodus Wallet implementation
  private async requestAccountsExodus(): Promise<string[]> {
    const walletWindow = this.getWalletWindow();
    const exodus = walletWindow?.exodus?.algorand;

    if (!exodus) {
      throw new Error('Exodus wallet is not available');
    }

    const accounts = await exodus.connect();
    return accounts;
  }

  private async requestSignatureExodus(txns: TransactionToSign[]): Promise<Uint8Array[]> {
    const walletWindow = this.getWalletWindow();
    const exodus = walletWindow?.exodus?.algorand;

    if (!exodus) {
      throw new Error('Exodus wallet is not available');
    }

    const encodedTxns = txns.map((t) => algosdk.encodeUnsignedTransaction(t.txn));
    const signedTxns = await exodus.signTransaction(encodedTxns);

    return signedTxns;
  }
}

/**
 * Create a new wallet service instance
 */
export function createWalletService(): VoiWalletService {
  return new VoiWalletService();
}

/**
 * Singleton wallet service (optional)
 */
let globalWalletService: VoiWalletService | null = null;

export function getWalletService(): VoiWalletService {
  if (!globalWalletService) {
    globalWalletService = new VoiWalletService();
  }
  return globalWalletService;
}
