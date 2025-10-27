/**
 * Voi Smart Contract Client
 *
 * Provides methods to interact with Voi blockchain slot machine contracts
 * Ported from house-of-voi prototype AlgorandService
 */

import algosdk from 'algosdk';
import { env } from '@/lib/utils/env';

export interface ContractBalances {
  balanceAvailable: number;
  balanceTotal: number;
  balanceLocked: number;
}

export interface VoiContractConfig {
  appId: number;
  nodeUrl?: string;
  indexerUrl?: string;
}

/**
 * Decode balance bytes returned from contract get_balances() call
 * Returns struct with: balanceLocked (uint64)
 * balanceTotal is calculated from contract account balance
 * balanceAvailable = balanceTotal - balanceLocked
 */
function decodeBalances(returnValue: Uint8Array): { balanceLocked: number } {
  // The contract returns a struct with:
  // - balance_available: uint64 (8 bytes) - not used, we calculate from contract balance
  // - balance_total: uint64 (8 bytes) - not used, we get from account info
  // - balance_locked: uint64 (8 bytes) - this is what we need
  // - balance_fuse: bool (1 byte)

  // Total struct size: 8 + 8 + 8 + 1 = 25 bytes
  if (returnValue.length < 25) {
    throw new Error(`Invalid balance data length: ${returnValue.length}, expected at least 25 bytes`);
  }

  // Extract balance_locked (bytes 16-23)
  const lockedBytes = returnValue.slice(16, 24);
  const balanceLocked = Number(algosdk.decodeUint64(lockedBytes, 'safe')) / 1e6; // Convert microVOI to VOI

  return { balanceLocked };
}

/**
 * Fetch treasury balances from a Voi slot machine contract
 * Uses the BankManager get_balances() method
 */
export async function getContractBalances(
  config: VoiContractConfig
): Promise<ContractBalances> {
  const { appId } = config;

  if (!appId || appId === 0) {
    throw new Error('Invalid app ID for getContractBalances');
  }

  const nodeUrl = config.nodeUrl || env.VOI_NODE_URL;

  if (!nodeUrl) {
    throw new Error('VOI_NODE_URL not configured');
  }

  // Create Algod client (Voi uses same SDK as Algorand)
  const client = new algosdk.Algodv2('', nodeUrl, '');

  // Get contract address from app ID
  const contractAddress = algosdk.getApplicationAddress(appId);

  try {
    // First, get the contract's account balance
    const accountInfo = await client.accountInformation(contractAddress).do();
    const balanceTotal = Number(accountInfo.amount) / 1e6; // Convert microVOI to VOI

    // Now call the contract's get_balances() method
    // This is a readonly call, so we use suggested params and simulate
    const suggestedParams = await client.getTransactionParams().do();

    // Create application call transaction for get_balances()
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      sender: contractAddress, // Can be any address for readonly calls
      appIndex: appId,
      appArgs: [new Uint8Array(Buffer.from('get_balances'))],
      suggestedParams,
    });

    // Simulate the transaction to get return value
    const encodedSimTxn = algosdk.encodeUnsignedSimulateTransaction(txn);
    const signedTxn = algosdk.SignedTransaction.fromEncodingData(
      algosdk.decodeObj(encodedSimTxn)
    );

    const request = new algosdk.modelsv2.SimulateRequest({
      txnGroups: [
        new algosdk.modelsv2.SimulateRequestTransactionGroup({
          txns: [signedTxn]
        })
      ]
    });

    const simResult = await client.simulateTransactions(request).do();

    if (!simResult.txnGroups?.[0]?.txnResults?.[0]?.txnResult?.logs) {
      throw new Error('No logs returned from contract simulation');
    }

    // The return value is in the last log entry (ABI return value)
    const logs = simResult.txnGroups[0].txnResults[0].txnResult.logs;
    const lastLog = logs[logs.length - 1];

    if (!lastLog) {
      throw new Error('No return value in contract logs');
    }

    // Decode the log (handle both string and byte array cases)
    const returnValueBytes =
      typeof lastLog === 'string'
        ? Uint8Array.from(Buffer.from(lastLog, 'base64'))
        : new Uint8Array(lastLog);

    // Skip first 4 bytes (ABI return prefix) and decode balances
    const balanceData = returnValueBytes.slice(4);
    const { balanceLocked } = decodeBalances(balanceData);

    const balanceAvailable = balanceTotal - balanceLocked;

    return {
      balanceAvailable,
      balanceTotal,
      balanceLocked
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get contract balances:', {
      appId,
      contractAddress,
      error: errorMessage
    });
    throw new Error(`Failed to get contract balances: ${errorMessage}`);
  }
}
