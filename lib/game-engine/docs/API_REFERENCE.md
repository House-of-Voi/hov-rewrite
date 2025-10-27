# API Reference

Complete documentation of the SlotMachineEngine API.

## Table of Contents

- [Constructor](#constructor)
- [Methods](#methods)
  - [initialize()](#initialize)
  - [spin()](#spin)
  - [getState()](#getstate)
  - [getConfig()](#getconfig)
  - [getBalance()](#getbalance)
  - [getPendingSpins()](#getpendingspins)
  - [reset()](#reset)
- [Event Listeners](#event-listeners)
  - [onOutcome()](#onoutcome)
  - [onBalanceUpdate()](#onbalanceupdate)
  - [onSpinStart()](#onspinstart)
  - [onSpinSubmitted()](#onspinsubmitted)
  - [onError()](#onerror)
  - [onStateChange()](#onstatechange)
- [Types](#types)

---

## Constructor

### `new SlotMachineEngine(config)`

Creates a new instance of the slot machine engine.

**Parameters:**

```typescript
interface EngineConfig {
  // Required
  contractId: string;          // Voi contract app ID (e.g., '40879920')
  chain: 'voi';                // Blockchain network

  // Optional
  sandbox?: boolean;           // Use sandbox mode (default: false)
  walletProvider?: string;     // Wallet provider name (prod only)
  rpcUrl?: string;             // Custom RPC URL
  autoConnect?: boolean;       // Auto-connect wallet (default: true)
}
```

**Example:**

```javascript
const game = new SlotMachineEngine({
  contractId: '40879920',
  chain: 'voi',
  sandbox: true
});
```

---

## Methods

### `initialize()`

Initialize the engine and connect to the blockchain. Must be called before any other methods.

**Returns:** `Promise<void>`

**Throws:** `Error` if initialization fails

**Example:**

```javascript
await game.initialize();
console.log('Game ready!');
```

**What it does:**
1. Connects to blockchain RPC
2. Loads contract configuration
3. Initializes wallet (if not sandbox)
4. Fetches user balance
5. Loads paytable and reel configuration

---

### `spin()`

Place a spin with specified bet amount and paylines.

**Signature:**

```typescript
spin(betAmount: number, paylines: number): Promise<string>
```

**Parameters:**

| Parameter | Type | Description | Range |
|-----------|------|-------------|-------|
| `betAmount` | `number` | Bet per line in microVOI | 1,000,000 - 100,000,000 (1-100 VOI) |
| `paylines` | `number` | Number of paylines to play | 1 - 20 |

**Returns:** `Promise<string>` - Spin ID for tracking

**Throws:**
- `Error('Insufficient balance')` - Not enough funds
- `Error('Invalid bet amount')` - Bet outside allowed range
- `Error('Invalid paylines')` - Paylines not 1-20
- `Error('Game not initialized')` - Called before `initialize()`

**Example:**

```javascript
try {
  // Bet 1 VOI per line on all 20 paylines = 20 VOI total
  const spinId = await game.spin(1_000_000, 20);
  console.log('Spin placed:', spinId);

  // onOutcome() will be called when result is ready
} catch (error) {
  console.error('Spin failed:', error.message);
}
```

**Flow:**

```
1. Validates bet and balance
2. Submits transaction to blockchain
3. Waits for confirmation (1 block)
4. Claims outcome
5. Triggers onOutcome() callback
```

**Timing:**
- **Sandbox mode:** Instant (~10ms)
- **Production mode:** 2-3 seconds (blockchain confirmation)

---

### `getState()`

Get current game state.

**Returns:** `GameState`

```typescript
interface GameState {
  isSpinning: boolean;           // Is a spin in progress?
  visibleGrid: string[][];       // Current 3x5 grid of symbols
  balance: number;               // Current balance in microVOI
  reservedBalance: number;       // Balance locked for pending spins
  availableBalance: number;      // balance - reservedBalance
  pendingSpins: number;          // Number of spins awaiting outcome
  currentBet: {
    betPerLine: number;
    paylines: number;
    totalBet: number;
  };
}
```

**Example:**

```javascript
const state = game.getState();

console.log('Balance:', state.balance / 1_000_000, 'VOI');
console.log('Spinning:', state.isSpinning);
console.log('Current grid:', state.visibleGrid);
```

---

### `getConfig()`

Get slot machine configuration (paytable, limits, etc.).

**Returns:** `SlotConfig`

```typescript
interface SlotConfig {
  contractId: string;
  name: string;
  displayName: string;

  // Betting limits
  minBet: number;              // Min bet per line (microVOI)
  maxBet: number;              // Max bet per line (microVOI)
  maxPaylines: number;         // Maximum paylines (usually 20)

  // Game parameters
  rtpTarget: number;           // Return to player % (e.g., 96.5)
  houseEdge: number;           // House edge % (e.g., 3.5)

  // Paytable
  paytable: {
    symbols: Array<{
      symbol: string;          // 'A', 'B', 'C', 'D', or '_'
      displayName: string;     // 'Diamond', 'Gold', etc.
      match3: number;          // Multiplier for 3 matches
      match4: number;          // Multiplier for 4 matches
      match5: number;          // Multiplier for 5 matches
    }>;
    maxPayoutMultiplier: number;
  };

  // Payline patterns
  paylinePatterns: Array<[number, number, number, number, number]>;
}
```

**Example:**

```javascript
const config = game.getConfig();

console.log('Min bet:', config.minBet / 1_000_000, 'VOI');
console.log('Max bet:', config.maxBet / 1_000_000, 'VOI');
console.log('RTP:', config.rtpTarget + '%');

// Show paytable
config.paytable.symbols.forEach(symbol => {
  console.log(`${symbol.symbol}: 3x=${symbol.match3}x, 4x=${symbol.match4}x, 5x=${symbol.match5}x`);
});
```

---

### `getBalance()`

Get current wallet balance.

**Returns:** `Promise<number>` - Balance in microVOI

**Example:**

```javascript
const balance = await game.getBalance();
console.log('Balance:', balance / 1_000_000, 'VOI');
```

---

### `getPendingSpins()`

Get list of spins that are still processing.

**Returns:** `PendingSpin[]`

```typescript
interface PendingSpin {
  id: string;
  betAmount: number;
  paylines: number;
  status: 'submitting' | 'waiting' | 'claiming';
  timestamp: number;
}
```

**Example:**

```javascript
const pending = game.getPendingSpins();
console.log(`${pending.length} spins pending`);

pending.forEach(spin => {
  console.log(`  ${spin.id}: ${spin.status}`);
});
```

---

### `reset()`

Reset the engine to initial state. Useful for starting fresh.

**Returns:** `void`

**Example:**

```javascript
game.reset();
console.log('Game reset to initial state');
```

---

## Event Listeners

All event listener methods return an **unsubscribe function**:

```javascript
const unsubscribe = game.onOutcome((result) => {
  console.log('Got result:', result);
});

// Later, stop listening:
unsubscribe();
```

---

### `onOutcome()`

Called when a spin outcome is ready. **This is the most important callback.**

**Signature:**

```typescript
onOutcome(callback: (result: SpinResult) => void): () => void
```

**Result Type:**

```typescript
interface SpinResult {
  // Outcome
  grid: string[][];            // 3x5 grid (5 reels x 3 symbols each)
  winnings: number;            // Total winnings in microVOI
  isWin: boolean;              // Did player win?

  // Win details
  winningLines: Array<{
    paylineIndex: number;      // Which payline (0-19)
    pattern: [number, number, number, number, number];  // Y-coords
    symbol: string;            // Winning symbol
    matchCount: number;        // How many matched (3, 4, or 5)
    payout: number;            // Payout for this line (microVOI)
  }>;

  // Bet info
  betPerLine: number;
  paylines: number;
  totalBet: number;
  netProfit: number;           // winnings - totalBet

  // Win level (for celebration animations)
  winLevel: 'small' | 'medium' | 'large' | 'jackpot';

  // Provably fair
  blockNumber: number;
  blockSeed: string;
  betKey: string;

  // Metadata
  spinId: string;
  timestamp: number;
}
```

**Example:**

```javascript
game.onOutcome((result) => {
  console.log('🎰 OUTCOME READY');
  console.log('Grid:', result.grid);
  console.log('Won:', result.winnings / 1_000_000, 'VOI');

  if (result.isWin) {
    console.log(`🎉 ${result.winLevel.toUpperCase()} WIN!`);

    // Animate each winning line
    result.winningLines.forEach(line => {
      animatePayline(line.paylineIndex, line.symbol);
    });

    // Play win sound based on level
    playWinSound(result.winLevel);
  }

  // Animate reels stopping on final grid
  animateReelsStop(result.grid);
});
```

---

### `onBalanceUpdate()`

Called whenever balance changes.

**Signature:**

```typescript
onBalanceUpdate(callback: (balance: number, previous: number) => void): () => void
```

**Example:**

```javascript
game.onBalanceUpdate((balance, previous) => {
  const change = balance - previous;
  console.log('Balance:', balance / 1_000_000, 'VOI');

  if (change > 0) {
    console.log('  +' + (change / 1_000_000), 'VOI');
  } else if (change < 0) {
    console.log('  ' + (change / 1_000_000), 'VOI');
  }

  // Update your UI
  updateBalanceDisplay(balance);
});
```

---

### `onSpinStart()`

Called immediately when spin is initiated (before blockchain).

**Signature:**

```typescript
onSpinStart(callback: (spinId: string, bet: BetInfo) => void): () => void
```

**Example:**

```javascript
game.onSpinStart((spinId, bet) => {
  console.log('Starting spin:', spinId);
  console.log('Bet:', bet.totalBet / 1_000_000, 'VOI');

  // Start reel spinning animation
  startReelAnimation();

  // Disable spin button
  disableSpinButton();
});
```

---

### `onSpinSubmitted()`

Called when spin transaction is confirmed on blockchain.

**Signature:**

```typescript
onSpinSubmitted(callback: (spinId: string, txId: string) => void): () => void
```

**Example:**

```javascript
game.onSpinSubmitted((spinId, txId) => {
  console.log('Spin submitted to blockchain');
  console.log('Transaction:', txId);

  // Show "waiting for outcome" message
  showWaitingMessage();
});
```

---

### `onError()`

Called when an error occurs.

**Signature:**

```typescript
onError(callback: (error: GameError) => void): () => void
```

**Error Type:**

```typescript
interface GameError {
  code: string;                // Error code
  message: string;             // Human-readable message
  details?: any;               // Additional error details
  recoverable: boolean;        // Can user retry?
}
```

**Example:**

```javascript
game.onError((error) => {
  console.error('Game error:', error.message);

  if (error.code === 'INSUFFICIENT_BALANCE') {
    showDepositPrompt();
  } else if (error.recoverable) {
    showRetryButton();
  } else {
    showFatalError(error.message);
  }
});
```

**Common Error Codes:**

| Code | Description | Recoverable |
|------|-------------|-------------|
| `INSUFFICIENT_BALANCE` | Not enough funds | ✅ Yes (deposit) |
| `INVALID_BET` | Bet outside limits | ✅ Yes (adjust bet) |
| `NETWORK_ERROR` | Blockchain connection failed | ✅ Yes (retry) |
| `TRANSACTION_FAILED` | Transaction rejected | ✅ Yes (retry) |
| `CONTRACT_ERROR` | Smart contract error | ❌ No |
| `NOT_INITIALIZED` | Called before initialize() | ❌ No |

---

### `onStateChange()`

Called whenever game state changes. Useful for debugging.

**Signature:**

```typescript
onStateChange(callback: (state: GameState) => void): () => void
```

**Example:**

```javascript
game.onStateChange((state) => {
  console.log('State updated:', {
    spinning: state.isSpinning,
    balance: state.balance / 1_000_000,
    pending: state.pendingSpins
  });
});
```

---

## Types

All TypeScript types are available in `types.d.ts`:

```typescript
import type {
  SlotMachineEngine,
  EngineConfig,
  GameState,
  SpinResult,
  SlotConfig,
  GameError
} from '@houseofvoi/slot-machine';
```

See [types.d.ts](./types.d.ts) for complete definitions.

---

## Complete Example

Putting it all together:

```javascript
import { SlotMachineEngine } from '@houseofvoi/slot-machine';

class MySlotGame {
  constructor() {
    this.engine = new SlotMachineEngine({
      contractId: '40879920',
      chain: 'voi',
      sandbox: false,
      walletProvider: 'your-wallet'
    });

    this.setupListeners();
  }

  async init() {
    await this.engine.initialize();
    console.log('Game ready!');
    this.updateUI();
  }

  setupListeners() {
    this.engine.onOutcome((result) => {
      this.handleOutcome(result);
    });

    this.engine.onBalanceUpdate((balance) => {
      this.updateBalance(balance);
    });

    this.engine.onSpinStart(() => {
      this.startSpinAnimation();
    });

    this.engine.onError((error) => {
      this.handleError(error);
    });
  }

  async spin(betAmount, paylines) {
    try {
      const spinId = await this.engine.spin(betAmount, paylines);
      console.log('Spin placed:', spinId);
    } catch (error) {
      console.error('Spin failed:', error);
    }
  }

  handleOutcome(result) {
    // Animate reels stopping
    this.animateReelsStop(result.grid);

    if (result.isWin) {
      // Celebrate!
      this.celebrateWin(result.winLevel, result.winnings);

      // Highlight winning lines
      result.winningLines.forEach(line => {
        this.highlightPayline(line.paylineIndex);
      });
    }
  }

  updateBalance(balance) {
    document.getElementById('balance').textContent =
      (balance / 1_000_000).toFixed(2) + ' VOI';
  }

  // ... UI methods ...
}

const game = new MySlotGame();
game.init();
```

