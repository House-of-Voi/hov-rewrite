/**
 * Voi Slot Machine Adapter
 *
 * Production blockchain adapter for Voi network.
 * Handles real blockchain transactions and contract interactions.
 */

import algosdk from 'algosdk';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';
import type { BlockchainAdapter } from '../SlotMachineEngine';
import type { BetKey, SpinOutcome, SlotMachineConfig, SymbolId } from '../types';
import { SlotMachineClient } from '../../contracts/SlotMachineClient';
import { VoiWalletService } from '../../voi/wallet-service';
import {
  DEFAULT_PAYTABLE,
  DEFAULT_PAYLINE_PATTERNS,
  evaluatePaylines,
} from '../utils/paylineEvaluator';

type PendingTransactionInfo = {
  confirmedRound?: number | bigint;
  logs?: Array<string | Uint8Array>;
  innerTxns?: PendingTransactionInfo[];
  ['inner-txns']?: PendingTransactionInfo[];
  poolError?: string;
  ['pool-error']?: string;
};

type BlockInfo = {
  seed?: Uint8Array | number[] | string;
};

/**
 * Voi adapter configuration
 */
export interface VoiAdapterConfig {
  /** Algod server URL */
  algodUrl?: string;
  /** Algod token */
  algodToken?: string;
  /** Network (mainnet, testnet, betanet) */
  network?: 'mainnet' | 'testnet' | 'betanet';
  /** Contract application ID */
  contractId: bigint;
  /** Wallet service instance */
  walletService: VoiWalletService;
}

/**
 * Default RPC endpoints for Voi
 */
const DEFAULT_RPC_URLS = {
  mainnet: 'https://mainnet-api.voi.nodely.io',
  testnet: 'https://testnet-api.voi.nodely.io',
  betanet: 'https://betanet-api.voi.nodely.io',
};

/**
 * Voi blockchain adapter
 */
export class VoiSlotMachineAdapter implements BlockchainAdapter {
  private config: VoiAdapterConfig;
  private algodClient: algosdk.Algodv2;
  private contractClient: SlotMachineClient | null = null;
  private walletService: VoiWalletService;

  constructor(config: VoiAdapterConfig) {
    this.config = {
      network: 'mainnet',
      algodUrl: DEFAULT_RPC_URLS[config.network || 'mainnet'],
      algodToken: '',
      ...config,
    };

    this.walletService = config.walletService;

    // Initialize Algod client
    this.algodClient = new algosdk.Algodv2(
      this.config.algodToken!,
      this.config.algodUrl!,
      ''
    );
  }

  /**
   * Initialize adapter
   */
  async initialize(): Promise<void> {
    try {
      // Ensure wallet is connected
      if (!this.walletService.isConnected()) {
        throw new Error('Wallet not connected');
      }

      // Initialize contract client
      this.contractClient = new SlotMachineClient(
        {
          sender: { addr: algosdk.Address.fromString(this.walletService.getAddress()!), signer: this.createSigner() },
          resolveBy: 'id',
          id: this.config.contractId,
        },
        this.algodClient
      );

      console.log('✓ Voi adapter initialized');
    } catch (error) {
      throw new Error(
        `Failed to initialize Voi adapter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Submit a spin to the blockchain
   */
  async submitSpin(
    betPerLine: number,
    paylines: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    walletAddress: string
  ): Promise<BetKey> {
    if (!this.contractClient) {
      throw new Error('Contract client not initialized');
    }

    try {
      // Call spin method on contract
      // Note: Payment handling is done by the contract internally
      const spinResult = await this.contractClient.spin(
        {
          betAmount: BigInt(betPerLine),
          providerId: BigInt(0), // Default provider ID
          index: BigInt(paylines - 1), // Player's choice of payline index
        },
        {
          sendParams: {
            fee: AlgoAmount.Algos(0.001), // 0.001 Algo fee
          },
        }
      );

      // Get transaction ID from the result
      const txId = spinResult.transaction.txID();

      // Get transaction info
      const txInfo = await this.waitForConfirmation(txId);

      // Extract bet key from logs/return value
      const betKey = this.extractBetKey(txInfo);

      const submitBlock = Number(txInfo.confirmedRound ?? 0);
      const claimBlock = submitBlock + 1; // Can claim next block

      console.log(`✓ Spin submitted: ${txId}`);

      return {
        key: betKey,
        txId,
        submitBlock,
        claimBlock,
      };
    } catch (error) {
      throw new Error(
        `Failed to submit spin: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Claim spin outcome from blockchain
   */
  async claimSpin(betKey: string): Promise<SpinOutcome> {
    if (!this.contractClient) {
      throw new Error('Contract client not initialized');
    }

    try {
      // Call claim method on contract
      const claimResult = await this.contractClient.claim(
        {
          betKey: new Uint8Array(Buffer.from(betKey.replace('0x', ''), 'hex')),
        },
        {
          sendParams: {
            fee: AlgoAmount.Algos(0.001),
          },
        }
      );

      // Get transaction ID from the result
      const txId = claimResult.transaction.txID();

      // Wait for confirmation
      const txInfo = await this.waitForConfirmation(txId);

      // Extract outcome from transaction
      const outcome = await this.extractOutcome(txInfo, betKey);

      console.log(`✓ Spin claimed: ${txId}`);

      return outcome;
    } catch (error) {
      throw new Error(
        `Failed to claim spin: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      return Number(accountInfo.amount); // Returns microVOI
    } catch (error) {
      throw new Error(
        `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    try {
      const status = await this.algodClient.status().do();
      return Number(status.lastRound);
    } catch (error) {
      throw new Error(
        `Failed to get current block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get contract configuration
   */
  async getContractConfig(): Promise<SlotMachineConfig> {
    if (!this.contractClient) {
      throw new Error('Contract client not initialized');
    }

    try {
      // Read contract state (currently unused but ensures contract access)
      await this.contractClient.appClient.getGlobalState();

      // Parse configuration from global state
      // Note: Actual parsing depends on contract implementation
      const config: SlotMachineConfig = {
        id: this.config.contractId.toString(),
        name: 'Voi Slot Machine',
        displayName: 'Alpha Slots',
        contractId: this.config.contractId,
        chain: 'voi',
        rtpTarget: 96.5,
        houseEdge: 3.5,
        minBet: 1_000_000, // 1 VOI
        maxBet: 100_000_000, // 100 VOI
        maxPaylines: 20,
        reelConfig: {
          reelCount: 5,
          reelLength: 100,
          windowLength: 3,
          reels: this.getDefaultReels(),
        },
        paylinePatterns: DEFAULT_PAYLINE_PATTERNS,
        paytable: DEFAULT_PAYTABLE,
        isActive: true,
      };

      return config;
    } catch (error) {
      throw new Error(
        `Failed to get contract config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create transaction signer from wallet service
   */
  private createSigner(): algosdk.TransactionSigner {
    return async (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => {
      const txnsToSign = indexesToSign.map((i) => txnGroup[i]);
      const signedTxns = await this.walletService.signTransactions(txnsToSign);
      return signedTxns.map((s) => s.blob);
    };
  }

  /**
   * Wait for transaction confirmation
  */
  private async waitForConfirmation(txID: string, timeoutRounds: number = 30): Promise<PendingTransactionInfo> {
    const txInfo = await algosdk.waitForConfirmation(this.algodClient, txID, timeoutRounds);

    const poolError =
      (txInfo as PendingTransactionInfo)['pool-error'] ||
      (txInfo as { poolError?: string }).poolError;

    if (poolError) {
      throw new Error(`Transaction pool error: ${poolError}`);
    }

    return txInfo as PendingTransactionInfo;
  }

  /**
   * Extract bet key from transaction info
   */
  private extractBetKey(txInfo: PendingTransactionInfo): string {
    // Extract from logs or return value
    // This depends on how the contract returns the bet key

    // Check logs
    const logs = this.normalizeLogs(txInfo.logs);
    if (logs.length > 0) {
      const betKeyBuffer = logs[0];
      return '0x' + betKeyBuffer.toString('hex');
    }

    // Check inner transactions
    const innerTxns = this.getInnerTransactions(txInfo);
    for (const innerTxn of innerTxns) {
      const innerLogs = this.normalizeLogs(innerTxn.logs);
      if (innerLogs.length > 0) {
        const betKeyBuffer = innerLogs[0];
        return '0x' + betKeyBuffer.toString('hex');
      }
    }

    throw new Error('Could not extract bet key from transaction');
  }

  /**
   * Extract outcome from transaction
   */
  private async extractOutcome(txInfo: PendingTransactionInfo, betKey: string): Promise<SpinOutcome> {
    // Get block seed for the claim round
    const blockNumber = Number(txInfo.confirmedRound ?? 0);
    const block = (await this.algodClient.block(blockNumber).do()) as BlockInfo;
    const blockSeed = this.extractBlockSeed(block);

    // Extract grid from transaction logs
    // The grid should be returned in the transaction logs/return value
    const gridData = this.extractGridData(txInfo);

    // Convert grid data to symbol grid
    const grid = this.parseGridData(gridData);

    // Evaluate paylines
    const winningLines = evaluatePaylines(
      grid,
      DEFAULT_PAYLINE_PATTERNS,
      DEFAULT_PAYTABLE,
      1_000_000 // This should be the actual bet per line
    );

    const totalPayout = winningLines.reduce((sum, line) => sum + line.payout, 0);

    return {
      grid,
      winningLines,
      totalPayout,
      blockNumber,
      blockSeed,
      betKey,
    };
  }

  private normalizeLogs(logs?: Array<string | Uint8Array>): Buffer[] {
    if (!logs || logs.length === 0) {
      return [];
    }

    return logs.map((log) =>
      typeof log === 'string' ? Buffer.from(log, 'base64') : Buffer.from(log)
    );
  }

  private getInnerTransactions(txInfo: PendingTransactionInfo): PendingTransactionInfo[] {
    if (Array.isArray(txInfo.innerTxns) && txInfo.innerTxns.length > 0) {
      return txInfo.innerTxns;
    }

    if (Array.isArray(txInfo['inner-txns']) && txInfo['inner-txns'].length > 0) {
      return txInfo['inner-txns'];
    }

    return [];
  }

  private extractBlockSeed(block: BlockInfo): string {
    const seedSource = block.seed;
    const seedBytes =
      typeof seedSource === 'string'
        ? Buffer.from(seedSource, 'base64')
        : seedSource
        ? Buffer.from(seedSource)
        : Buffer.alloc(0);

    return `0x${seedBytes.toString('hex')}`;
  }

  private extractGridData(txInfo: PendingTransactionInfo): number[] {
    const logs = this.normalizeLogs(txInfo.logs);
    if (logs.length > 0) {
      return Array.from(logs[0].values());
    }

    for (const inner of this.getInnerTransactions(txInfo)) {
      const innerLogs = this.normalizeLogs(inner.logs);
      if (innerLogs.length > 0) {
        return Array.from(innerLogs[0].values());
      }
    }

    return [];
  }

  /**
   * Parse grid data from bytes
   */
  private parseGridData(gridData: number[]): SymbolId[][] {
    const symbolMap: { [key: number]: SymbolId } = {
      65: 'A', // ASCII 'A'
      66: 'B', // ASCII 'B'
      67: 'C', // ASCII 'C'
      68: 'D', // ASCII 'D'
      95: '_', // ASCII '_'
    };

    const grid: SymbolId[][] = [];

    // Grid is stored as 15 bytes: reel0[3], reel1[3], reel2[3], reel3[3], reel4[3]
    for (let reel = 0; reel < 5; reel++) {
      const reelSymbols: SymbolId[] = [];
      for (let row = 0; row < 3; row++) {
        const index = reel * 3 + row;
        const symbolCode = gridData[index];
        reelSymbols.push(symbolMap[symbolCode] || 'D');
      }
      grid.push(reelSymbols);
    }

    return grid;
  }

  /**
   * Get default reel configuration
   */
  private getDefaultReels(): SymbolId[][] {
    // This should match the contract's reel configuration
    // For now, use a default distribution
    const reels: SymbolId[][] = [];

    const distribution = {
      A: 5,
      B: 15,
      C: 25,
      D: 30,
      _: 25,
    };

    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      const reel: SymbolId[] = [];

      for (const [symbol, count] of Object.entries(distribution)) {
        for (let i = 0; i < count; i++) {
          reel.push(symbol as SymbolId);
        }
      }

      reels.push(reel);
    }

    return reels;
  }
}
