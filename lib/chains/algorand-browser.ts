import algosdk from 'algosdk';

/**
 * Creates a self-payment transaction with a custom note that can be used as a
 * proof-of-ownership payload. The transaction is not meant to be broadcast—
 * it only exists so the user can sign it locally.
 */
export function buildProofOfOwnershipTransaction(
  algorandAddress: string,
  challengeToken: string
): algosdk.Transaction {
  const suggestedParams: algosdk.SuggestedParams = {
    flatFee: true,
    fee: 0,
    minFee: 0,
    firstValid: 1,
    lastValid: 1000,
    genesisID: 'voi-link-v1',
    genesisHash: new Uint8Array(32),
  };

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: algorandAddress,
    receiver: algorandAddress,
    amount: 0,
    note: new TextEncoder().encode(challengeToken),
    suggestedParams,
  });
}
