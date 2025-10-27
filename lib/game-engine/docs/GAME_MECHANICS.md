# Game Mechanics

Complete guide to how the 5-reel slot machine works.

## Table of Contents

- [Overview](#overview)
- [Reels & Symbols](#reels--symbols)
- [Paylines](#paylines)
- [Paytable](#paytable)
- [How to Win](#how-to-win)
- [RTP & House Edge](#rtp--house-edge)
- [Provably Fair](#provably-fair)
- [Betting](#betting)
- [Game Flow](#game-flow)

---

## Overview

This is a **5-reel, 3-row** slot machine with **20 paylines**.

```
┌─────┬─────┬─────┬─────┬─────┐
│  A  │  B  │  C  │  D  │  A  │  ← Row 0 (top)
├─────┼─────┼─────┼─────┼─────┤
│  B  │  C  │  D  │  A  │  B  │  ← Row 1 (middle)
├─────┼─────┼─────┼─────┼─────┤
│  C  │  D  │  A  │  B  │  C  │  ← Row 2 (bottom)
└─────┴─────┴─────┴─────┴─────┘
  ↑     ↑     ↑     ↑     ↑
Reel 0  1     2     3     4
```

Players win by landing **3 or more matching symbols** on active paylines from **left to right**.

---

## Reels & Symbols

### Reel Configuration

- **5 reels** (columns)
- **100 symbols** per reel (looping)
- **3 visible symbols** per reel (the "window")
- Each reel has a different symbol distribution

### Symbols

There are **5 symbols**:

| Symbol | Name | Rarity |
|--------|------|--------|
| **A** | Diamond | Rare (highest payout) |
| **B** | Gold | Uncommon |
| **C** | Silver | Common |
| **D** | Bronze | Common |
| **_** | Blank | Very common (no payout) |

**Symbol Distribution Example (Reel 1):**
```
A: 5 times   (5% chance)
B: 15 times  (15% chance)
C: 25 times  (25% chance)
D: 30 times  (30% chance)
_: 25 times  (25% chance - blank)
```

Each reel has a **different distribution** to create interesting gameplay.

---

## Paylines

There are **20 predefined paylines** that cross the reels in different patterns.

### How Paylines Work

Each payline specifies a **Y-coordinate** for each of the 5 reels.

**Example:** Payline 0 (middle line)
```
Pattern: [1, 1, 1, 1, 1]

┌─────┬─────┬─────┬─────┬─────┐
│  A  │  B  │  C  │  D  │  A  │
├─────┼─────┼─────┼─────┼─────┤
│ [B] │ [C] │ [D] │ [A] │ [B] │  ← Payline reads these
├─────┼─────┼─────┼─────┼─────┤
│  C  │  D  │  A  │  B  │  C  │
└─────┴─────┴─────┴─────┴─────┘
```

### All 20 Paylines

```javascript
const PAYLINES = [
  [1, 1, 1, 1, 1],  // 0:  Middle line        ═════
  [0, 0, 0, 0, 0],  // 1:  Top line           ─────
  [2, 2, 2, 2, 2],  // 2:  Bottom line        _____
  [0, 1, 2, 1, 0],  // 3:  V shape            ╲   ╱
  [2, 1, 0, 1, 2],  // 4:  Inverted V         ╱   ╲
  [1, 0, 0, 0, 1],  // 5:  Up then down       ═╲___╱
  [1, 2, 2, 2, 1],  // 6:  Down then up       ═╱‾‾‾╲
  [0, 0, 1, 2, 2],  // 7:  Descending stairs  ─╲__╲_
  [2, 2, 1, 0, 0],  // 8:  Ascending stairs   _╱‾‾╱─
  [1, 2, 1, 0, 1],  // 9:  Zigzag down        ═╲═╱═
  [1, 0, 1, 2, 1],  // 10: Zigzag up          ═╱═╲═
  [0, 1, 0, 1, 0],  // 11: Wave top           ─╲─╱─
  [2, 1, 2, 1, 2],  // 12: Wave bottom        _╱_╲_
  [1, 0, 0, 1, 2],  // 13: Diagonal rise      ═╱──╲_
  [1, 2, 2, 1, 0],  // 14: Diagonal fall      ═╲__╱─
  [0, 0, 1, 0, 0],  // 15: Peak               ──╱╲──
  [2, 2, 1, 2, 2],  // 16: Valley             __╲╱__
  [0, 1, 1, 1, 0],  // 17: Plateau up         ─╱═══╲
  [2, 1, 1, 1, 2],  // 18: Plateau down       _╲═══╱
  [1, 1, 0, 1, 1],  // 19: Peak middle        ══╱╲══
];
```

### Selecting Paylines

Players can bet on **1 to 20 paylines**.

- **More paylines = more chances to win**
- **But also = higher total bet**

**Example:**
- Bet **1 VOI per line** on **5 paylines** = **5 VOI total**
- Bet **1 VOI per line** on **20 paylines** = **20 VOI total**

---

## Paytable

Payouts are based on **consecutive matching symbols from left to right**.

### Payout Multipliers

| Symbol | 3-of-a-kind | 4-of-a-kind | 5-of-a-kind |
|--------|-------------|-------------|-------------|
| **A** (Diamond) | 200x | 1,000x | **10,000x** 💎 |
| **B** (Gold) | 60x | 200x | 1,000x |
| **C** (Silver) | 30x | 100x | 500x |
| **D** (Bronze) | 10x | 55x | 250x |
| **_** (Blank) | — | — | — |

### Examples

**Example 1:** Three **B** symbols on payline 0, bet 1 VOI per line

```
Grid:
┌─────┬─────┬─────┬─────┬─────┐
│  A  │  C  │  D  │  A  │  B  │
├─────┼─────┼─────┼─────┼─────┤
│ [B] │ [B] │ [B] │ [A] │ [C] │  ← Payline 0
├─────┼─────┼─────┼─────┼─────┤
│  C  │  D  │  A  │  B  │  C  │
└─────┴─────┴─────┴─────┴─────┘

Result: B B B = 3 matches
Payout: 1 VOI × 60 = 60 VOI
```

**Example 2:** Five **A** symbols on payline 3, bet 2 VOI per line

```
Grid:
┌─────┬─────┬─────┬─────┬─────┐
│ [A] │  B  │  C  │  D  │ [A] │  ← Payline 3 (V-shape)
├─────┼─────┼─────┼─────┼─────┤
│  B  │ [A] │  D  │ [A] │  B  │  ← Payline 3
├─────┼─────┼─────┼─────┼─────┤
│  C  │  D  │ [A] │  B  │  C  │  ← Payline 3
└─────┴─────┴─────┴─────┴─────┘

Result: A A A A A = 5 matches (JACKPOT!)
Payout: 2 VOI × 10,000 = 20,000 VOI 💰
```

**Example 3:** Multiple winning paylines

```
Grid:
┌─────┬─────┬─────┬─────┬─────┐
│  C  │  C  │  C  │  A  │  B  │  ← Payline 1: C C C = 30x
├─────┼─────┼─────┼─────┼─────┤
│  D  │  D  │  D  │  D  │  C  │  ← Payline 0: D D D D = 55x
├─────┼─────┼─────┼─────┼─────┤
│  A  │  B  │  C  │  D  │  A  │
└─────┴─────┴─────┴─────┴─────┘

Bet: 1 VOI per line, 20 paylines
Payline 0 wins: 1 VOI × 55 = 55 VOI
Payline 1 wins: 1 VOI × 30 = 30 VOI
Total payout: 85 VOI
Net profit: 85 - 20 = 65 VOI
```

---

## How to Win

To win on a payline:

1. ✅ **Payline must be active** (you bet on it)
2. ✅ **3 or more matching symbols**
3. ✅ **Consecutive from left to right**
4. ✅ **Symbol cannot be blank (_)**

### Valid Wins

```
✅ [A][A][A] D  B   = 3 consecutive As (wins)
✅ [D][D][D][D] C   = 4 consecutive Ds (wins)
✅ [B][B][B][B][B]  = 5 consecutive Bs (wins)
```

### Invalid (No Win)

```
❌ A  B  C  D  A    = No matches
❌ [A][A] C [A][A]  = Not consecutive
❌ D  [A][A][A] B   = Doesn't start from left
❌ [_][_][_] A  B   = Blank symbols don't pay
❌ B [A][A][A][A]   = First symbol doesn't match
```

---

## RTP & House Edge

### Return to Player (RTP)

**RTP:** 96.5%

This means for every 100 VOI wagered, players receive back (on average):
- **96.5 VOI** in winnings
- **3.5 VOI** house profit

**Note:** RTP is calculated over millions of spins. Short-term results vary wildly!

### House Edge

**House Edge:** 3.5%

The casino's statistical advantage. This is how we make money while still offering great payouts.

### Volatility

This game has **medium-high volatility**:
- Small wins are relatively common
- Medium wins are uncommon
- Large wins (100x+) are rare
- Jackpots (10,000x) are very rare

---

## Provably Fair

Every spin is **provably fair** using blockchain randomness.

### How It Works

1. **Player places bet**
   - Bet is submitted to smart contract
   - Contract generates a unique `bet_key`

2. **Wait one block** (~2 seconds)
   - Block is confirmed on blockchain
   - Block contains cryptographic seed

3. **Outcome is determined**
   ```
   seed = SHA256(block_seed + bet_key)
   reel_tops = seed % 100  (for each reel)
   grid = get_symbols_at(reel_tops)
   ```

4. **Player can verify**
   - All inputs are public (block_seed, bet_key)
   - Anyone can recompute the outcome
   - Math proves it wasn't rigged

### Verification Example

```javascript
// Inputs (publicly available)
const blockSeed = '0xabc123...';
const betKey = '0xdef456...';

// Compute outcome
const hash = SHA256(blockSeed + betKey);
const reel0_position = hash[0] % 100;
const reel1_position = hash[1] % 100;
// ... etc

// This MUST match the outcome you received
```

We provide verification tools in the API:

```javascript
const verified = await game.verifyOutcome(result);
if (verified) {
  console.log('✓ Outcome is provably fair');
}
```

---

## Betting

### Bet Structure

```
Total Bet = Bet Per Line × Number of Paylines
```

**Example:**
- Bet per line: **2 VOI**
- Paylines selected: **10**
- **Total bet: 20 VOI**

### Limits

| Parameter | Minimum | Maximum |
|-----------|---------|---------|
| Bet per line | 1 VOI | 100 VOI |
| Paylines | 1 | 20 |
| Total bet | 1 VOI | 2,000 VOI |

### Fees

Small blockchain fees are deducted:
- **Transaction fee:** ~0.001 VOI
- **Contract fee:** ~0.0005 VOI

Fees are automatically included in the transaction.

---

## Game Flow

### Complete Spin Lifecycle

```
1. Player clicks SPIN
   ↓
2. Your UI calls: game.spin(betAmount, paylines)
   ↓
3. Middleware validates bet and balance
   ↓
4. Transaction submitted to blockchain
   │ onSpinStart() fires → Start reel animation
   ↓
5. Wait for block confirmation (~2 seconds)
   │ onSpinSubmitted() fires → Show "waiting" state
   ↓
6. Claim outcome from contract
   ↓
7. Calculate payouts
   ↓
8. onOutcome() fires with result
   │ → Stop reels on final grid
   │ → Highlight winning lines (if any)
   │ → Update balance
   │ → Play sounds/animations
   ↓
9. Ready for next spin
```

### Timing

| Stage | Duration | Notes |
|-------|----------|-------|
| Validation | <10ms | Instant |
| Submit transaction | ~500ms | Network latency |
| Block confirmation | ~2 seconds | Blockchain time |
| Claim outcome | ~500ms | Network latency |
| **Total** | **~3 seconds** | Production mode |

**Sandbox mode:** All stages are instant (~10ms total)

---

## Win Levels

For animation purposes, wins are classified into levels:

| Level | Multiplier | Example |
|-------|------------|---------|
| **Small** | 1x - 5x | Bet 10 VOI, win 10-50 VOI |
| **Medium** | 5x - 20x | Bet 10 VOI, win 50-200 VOI |
| **Large** | 20x - 100x | Bet 10 VOI, win 200-1,000 VOI |
| **Jackpot** | 100x+ | Bet 10 VOI, win 1,000+ VOI |

Use these to trigger appropriate celebrations:

```javascript
game.onOutcome((result) => {
  switch(result.winLevel) {
    case 'small':
      playChime();
      break;
    case 'medium':
      playFanfare();
      showCoinAnimation();
      break;
    case 'large':
      playBigWinMusic();
      showFireworks();
      break;
    case 'jackpot':
      playJackpotMusic();
      showMassiveExplosion();
      break;
  }
});
```

---

## Summary

**Key Takeaways:**
- 5 reels × 3 rows = 15 visible symbols
- 20 paylines with unique patterns
- Win with 3+ consecutive matching symbols (left to right)
- Payouts from 10x to 10,000x
- RTP: 96.5%, House Edge: 3.5%
- Provably fair using blockchain randomness
- ~3 second spin time in production

