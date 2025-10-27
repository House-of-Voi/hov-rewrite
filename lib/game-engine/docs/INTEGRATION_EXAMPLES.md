# Integration Guide

Step-by-step guide to integrate House of Voi slot machine middleware with your game engine.

## Table of Contents

- [Integration Overview](#integration-overview)
- [Unity Integration](#unity-integration)
- [Phaser Integration](#phaser-integration)
- [Custom WebGL/Canvas](#custom-webglcanvas)
- [Plain JavaScript](#plain-javascript)
- [State Management](#state-management)
- [Animation Timing](#animation-timing)
- [Best Practices](#best-practices)

---

## Integration Overview

### What You Build vs What We Provide

**You build (Frontend/UI):**
- 🎨 Reel animations
- 🎉 Win celebrations
- 🔊 Sound effects
- 🎮 Bet controls
- 📊 Balance display
- ⚙️ Settings UI

**We provide (Blockchain/Backend):**
- 🔗 Wallet connection
- 💰 Balance management
- 🎲 RNG and outcomes
- ✅ Transaction signing
- 🔐 Provably fair verification

### The Contract

```typescript
// You call our API:
const spinId = await game.spin(betAmount, paylines);

// We call your callbacks:
game.onOutcome((result) => {
  // You animate the result
  animateReels(result.grid);
  if (result.isWin) {
    celebrateWin(result.winLevel);
  }
});
```

### Key Integration Points

1. **Initialization** - Set up the engine when your game loads
2. **Spin Button** - Call `game.spin()` when player clicks spin
3. **Outcome Handler** - Animate reels when `onOutcome()` fires
4. **Balance Display** - Update UI when `onBalanceUpdate()` fires
5. **Error Handling** - Show errors when `onError()` fires

---

## Unity Integration

### Setup

1. **Import JavaScript Bridge**

Unity can communicate with JavaScript using `Application.ExternalCall()` and `Application.ExternalEval()`.

**In Unity (C#):**
```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class SlotMachineManager : MonoBehaviour
{
    // Import JavaScript functions
    [DllImport("__Internal")]
    private static extern void InitializeSlotMachine(string contractId);

    [DllImport("__Internal")]
    private static extern void PlaceSpin(int betAmount, int paylines);

    void Start()
    {
        // Initialize on game start
        InitializeSlotMachine("40879920");
    }

    public void OnSpinButtonClicked()
    {
        // Player clicked spin button
        int betAmount = 1000000; // 1 VOI
        int paylines = 20;
        PlaceSpin(betAmount, paylines);
    }

    // Unity methods called FROM JavaScript
    public void OnOutcomeReceived(string outcomeJson)
    {
        Debug.Log("Received outcome: " + outcomeJson);

        // Parse JSON
        SpinResult result = JsonUtility.FromJson<SpinResult>(outcomeJson);

        // Animate reels
        AnimateReels(result.grid);

        if (result.isWin)
        {
            CelebrateWin(result.winLevel, result.winnings);
        }
    }

    public void OnBalanceUpdated(long balance)
    {
        Debug.Log("Balance updated: " + balance);
        UpdateBalanceUI(balance);
    }

    public void OnErrorOccurred(string errorMessage)
    {
        Debug.LogError("Game error: " + errorMessage);
        ShowErrorDialog(errorMessage);
    }
}

[System.Serializable]
public class SpinResult
{
    public string[][] grid;
    public long winnings;
    public bool isWin;
    public string winLevel;
    public WinningLine[] winningLines;
}

[System.Serializable]
public class WinningLine
{
    public int paylineIndex;
    public string symbol;
    public int matchCount;
    public long payout;
}
```

2. **JavaScript Bridge** (in your index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.houseofvoi.com/slot-machine/v1.0.0/index.js"></script>
  <script>
    let game;

    // Called from Unity
    function InitializeSlotMachine(contractId) {
      game = new HouseOfVoi.SlotMachineEngine({
        contractId: contractId,
        chain: 'voi',
        sandbox: false
      });

      game.initialize().then(() => {
        console.log('Game initialized');

        // Set up callbacks to Unity
        game.onOutcome((result) => {
          // Send to Unity
          const json = JSON.stringify({
            grid: result.grid,
            winnings: result.winnings,
            isWin: result.isWin,
            winLevel: result.winLevel,
            winningLines: result.winningLines
          });
          SendMessage('SlotMachineManager', 'OnOutcomeReceived', json);
        });

        game.onBalanceUpdate((balance) => {
          SendMessage('SlotMachineManager', 'OnBalanceUpdated', balance.toString());
        });

        game.onError((error) => {
          SendMessage('SlotMachineManager', 'OnErrorOccurred', error.message);
        });
      });
    }

    // Called from Unity
    function PlaceSpin(betAmount, paylines) {
      game.spin(betAmount, paylines)
        .then((spinId) => {
          console.log('Spin placed:', spinId);
        })
        .catch((error) => {
          SendMessage('SlotMachineManager', 'OnErrorOccurred', error.message);
        });
    }
  </script>
</head>
<body>
  <!-- Unity canvas container -->
  <div id="unity-container"></div>
</body>
</html>
```

### Animation Flow in Unity

```csharp
private IEnumerator AnimateReels(string[][] finalGrid)
{
    // 1. Start spinning animation
    foreach (var reel in reels)
    {
        reel.StartSpinning();
    }

    // 2. Spin for at least 2 seconds (feels good)
    yield return new WaitForSeconds(2f);

    // 3. Stop each reel in sequence
    for (int i = 0; i < 5; i++)
    {
        reels[i].StopOnSymbols(finalGrid[i]);
        yield return new WaitForSeconds(0.2f); // Stagger
    }

    // 4. All reels stopped
    OnAllReelsStopped();
}

private void CelebrateWin(string winLevel, long winnings)
{
    switch (winLevel)
    {
        case "small":
            PlaySound(smallWinSound);
            ShowCoins(10);
            break;
        case "medium":
            PlaySound(mediumWinSound);
            ShowCoins(50);
            StartCoroutine(FlashWinningLines());
            break;
        case "large":
            PlaySound(largeWinSound);
            ShowFireworks();
            StartCoroutine(FlashWinningLines());
            break;
        case "jackpot":
            PlaySound(jackpotSound);
            ShowMassiveCelebration();
            StartCoroutine(FlashWinningLines());
            break;
    }

    // Show win amount
    winAmountText.text = $"+{winnings / 1_000_000f:F2} VOI";
    StartCoroutine(AnimateWinAmount());
}
```

---

## Phaser Integration

### Setup

Phaser 3 example:

```javascript
import Phaser from 'phaser';
import { SlotMachineEngine } from '@houseofvoi/slot-machine';

class SlotMachineScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SlotMachineScene' });
    this.game = null;
    this.reels = [];
    this.spinning = false;
  }

  preload() {
    // Load your assets
    this.load.image('symbol_A', 'assets/symbol_A.png');
    this.load.image('symbol_B', 'assets/symbol_B.png');
    this.load.image('symbol_C', 'assets/symbol_C.png');
    this.load.image('symbol_D', 'assets/symbol_D.png');
    this.load.image('symbol_blank', 'assets/symbol_blank.png');
    this.load.audio('spin', 'assets/sounds/spin.mp3');
    this.load.audio('win', 'assets/sounds/win.mp3');
  }

  async create() {
    // Initialize slot machine engine
    this.game = new SlotMachineEngine({
      contractId: '40879920',
      chain: 'voi',
      sandbox: true
    });

    await this.game.initialize();

    // Set up callbacks
    this.game.onOutcome((result) => {
      this.handleOutcome(result);
    });

    this.game.onBalanceUpdate((balance) => {
      this.updateBalance(balance);
    });

    this.game.onError((error) => {
      this.showError(error.message);
    });

    // Create UI
    this.createReels();
    this.createSpinButton();
    this.createBalanceDisplay();
  }

  createReels() {
    const startX = 200;
    const startY = 200;
    const spacing = 120;

    for (let i = 0; i < 5; i++) {
      const reel = this.add.container(startX + (i * spacing), startY);

      // Add 3 symbol sprites per reel
      for (let j = 0; j < 3; j++) {
        const symbol = this.add.sprite(0, j * 100, 'symbol_A');
        reel.add(symbol);
      }

      this.reels.push(reel);
    }
  }

  createSpinButton() {
    const button = this.add.text(400, 500, 'SPIN', {
      fontSize: '48px',
      fill: '#fff',
      backgroundColor: '#667eea',
      padding: { x: 40, y: 20 }
    }).setInteractive();

    button.on('pointerdown', () => {
      this.onSpinClicked();
    });
  }

  async onSpinClicked() {
    if (this.spinning) return;

    this.spinning = true;

    try {
      // Start animation
      this.startSpinAnimation();

      // Place spin
      await this.game.spin(1_000_000, 20); // 1 VOI, 20 lines

      // onOutcome callback will handle the rest
    } catch (error) {
      this.spinning = false;
      this.showError(error.message);
    }
  }

  startSpinAnimation() {
    // Animate reels spinning
    this.reels.forEach((reel, index) => {
      this.tweens.add({
        targets: reel,
        y: '+=1000',
        duration: 500,
        repeat: -1, // Infinite until we stop it
        ease: 'Linear'
      });
    });
  }

  handleOutcome(result) {
    console.log('Outcome:', result);

    // Stop spinning animation
    this.stopReelsOnGrid(result.grid);

    // Wait for reels to stop, then celebrate
    this.time.delayedCall(1000, () => {
      this.spinning = false;

      if (result.isWin) {
        this.celebrateWin(result);
      }
    });
  }

  stopReelsOnGrid(grid) {
    this.reels.forEach((reel, reelIndex) => {
      // Stop tweens
      this.tweens.killTweensOf(reel);

      // Set final symbols
      const symbols = reel.list; // Get child sprites
      for (let row = 0; row < 3; row++) {
        const symbolName = 'symbol_' + grid[reelIndex][row];
        symbols[row].setTexture(symbolName);
      }

      // Tween to final position
      this.tweens.add({
        targets: reel,
        y: 200,
        duration: 200 + (reelIndex * 100), // Stagger
        ease: 'Bounce.easeOut'
      });
    });
  }

  celebrateWin(result) {
    // Play win sound
    this.sound.play('win');

    // Show win text
    const winText = this.add.text(400, 300,
      `+${result.winnings / 1_000_000} VOI`, {
      fontSize: '72px',
      fill: '#ffd700'
    }).setOrigin(0.5);

    // Animate
    this.tweens.add({
      targets: winText,
      scale: 2,
      alpha: 0,
      duration: 2000,
      onComplete: () => winText.destroy()
    });

    // Highlight winning lines
    result.winningLines.forEach((line, index) => {
      this.time.delayedCall(index * 500, () => {
        this.highlightPayline(line.paylineIndex);
      });
    });
  }

  updateBalance(balance) {
    if (this.balanceText) {
      this.balanceText.setText(
        `Balance: ${(balance / 1_000_000).toFixed(2)} VOI`
      );
    }
  }

  showError(message) {
    const errorText = this.add.text(400, 100, message, {
      fontSize: '24px',
      fill: '#ff0000'
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => errorText.destroy());
  }
}

// Start Phaser
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: SlotMachineScene
};

new Phaser.Game(config);
```

---

## Custom WebGL/Canvas

For custom rendering engines:

```javascript
class CustomSlotMachine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Initialize engine
    this.engine = new SlotMachineEngine({
      contractId: '40879920',
      chain: 'voi',
      sandbox: true
    });

    this.setupCallbacks();
    this.init();
  }

  async init() {
    await this.engine.initialize();
    this.startRenderLoop();
  }

  setupCallbacks() {
    this.engine.onOutcome((result) => {
      this.handleOutcome(result);
    });

    this.engine.onBalanceUpdate((balance) => {
      this.balance = balance;
    });
  }

  startRenderLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render reels
    this.renderReels();

    // Render UI
    this.renderBalance();
    this.renderSpinButton();
  }

  renderReels() {
    const state = this.engine.getState();
    const grid = state.visibleGrid;

    for (let reel = 0; reel < 5; reel++) {
      for (let row = 0; row < 3; row++) {
        const symbol = grid[reel][row];
        const x = 100 + (reel * 120);
        const y = 100 + (row * 100);

        // Draw symbol
        this.ctx.font = '48px Arial';
        this.ctx.fillText(symbol, x, y);

        // Draw border
        this.ctx.strokeRect(x - 10, y - 40, 80, 80);
      }
    }
  }

  async handleSpinClick() {
    try {
      await this.engine.spin(1_000_000, 20);
    } catch (error) {
      console.error('Spin failed:', error);
    }
  }

  handleOutcome(result) {
    console.log('Outcome:', result);

    // Animate outcome
    this.animateOutcome(result);

    if (result.isWin) {
      this.celebrateWin(result);
    }
  }
}

// Usage
const game = new CustomSlotMachine('gameCanvas');
```

---

## Plain JavaScript

Simple HTML/CSS/JS integration:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Slot Machine</title>
  <style>
    .reel-container {
      display: flex;
      gap: 10px;
      margin: 20px;
    }
    .reel {
      width: 100px;
      height: 300px;
      border: 2px solid #333;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      background: #fff;
    }
    .symbol {
      font-size: 48px;
      transition: transform 0.3s;
    }
    .spinning .symbol {
      animation: spin 0.1s linear infinite;
    }
    @keyframes spin {
      from { transform: translateY(0); }
      to { transform: translateY(-100px); }
    }
    button {
      font-size: 24px;
      padding: 15px 40px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="balance">Balance: Loading...</div>

  <div class="reel-container" id="reels">
    <!-- Reels will be generated here -->
  </div>

  <button id="spinBtn" onclick="spin()">SPIN (1 VOI)</button>

  <div id="message"></div>

  <script src="https://cdn.houseofvoi.com/slot-machine/v1.0.0/index.js"></script>
  <script>
    let game;

    async function init() {
      // Create engine
      game = new HouseOfVoi.SlotMachineEngine({
        contractId: '40879920',
        chain: 'voi',
        sandbox: true
      });

      await game.initialize();

      // Set up callbacks
      game.onOutcome(handleOutcome);
      game.onBalanceUpdate(updateBalance);
      game.onError(showError);

      // Create reels
      createReels();
    }

    function createReels() {
      const container = document.getElementById('reels');
      const state = game.getState();

      for (let reel = 0; reel < 5; reel++) {
        const reelEl = document.createElement('div');
        reelEl.className = 'reel';
        reelEl.id = `reel${reel}`;

        for (let row = 0; row < 3; row++) {
          const symbol = document.createElement('div');
          symbol.className = 'symbol';
          symbol.textContent = state.visibleGrid[reel][row];
          reelEl.appendChild(symbol);
        }

        container.appendChild(reelEl);
      }
    }

    async function spin() {
      const btn = document.getElementById('spinBtn');
      btn.disabled = true;

      // Start animation
      document.querySelectorAll('.reel').forEach(reel => {
        reel.classList.add('spinning');
      });

      try {
        await game.spin(1_000_000, 20);
      } catch (error) {
        showError(error);
        stopSpinning();
        btn.disabled = false;
      }
    }

    function handleOutcome(result) {
      console.log('Outcome:', result);

      // Stop animation
      stopSpinning();

      // Update grid
      updateGrid(result.grid);

      // Celebrate if win
      if (result.isWin) {
        document.getElementById('message').textContent =
          `🎉 YOU WON ${result.winnings / 1_000_000} VOI!`;
      } else {
        document.getElementById('message').textContent = 'Try again!';
      }

      // Re-enable button
      document.getElementById('spinBtn').disabled = false;
    }

    function stopSpinning() {
      document.querySelectorAll('.reel').forEach(reel => {
        reel.classList.remove('spinning');
      });
    }

    function updateGrid(grid) {
      for (let reel = 0; reel < 5; reel++) {
        const reelEl = document.getElementById(`reel${reel}`);
        const symbols = reelEl.querySelectorAll('.symbol');

        for (let row = 0; row < 3; row++) {
          symbols[row].textContent = grid[reel][row];
        }
      }
    }

    function updateBalance(balance) {
      document.getElementById('balance').textContent =
        `Balance: ${(balance / 1_000_000).toFixed(2)} VOI`;
    }

    function showError(error) {
      alert('Error: ' + error.message);
    }

    init();
  </script>
</body>
</html>
```

---

## State Management

### Tracking Game State

```javascript
class GameStateManager {
  constructor(engine) {
    this.engine = engine;
    this.state = {
      spinning: false,
      balance: 0,
      lastResult: null,
      pendingSpins: []
    };

    this.setupListeners();
  }

  setupListeners() {
    this.engine.onSpinStart(() => {
      this.state.spinning = true;
      this.notifyStateChange();
    });

    this.engine.onOutcome((result) => {
      this.state.spinning = false;
      this.state.lastResult = result;
      this.notifyStateChange();
    });

    this.engine.onBalanceUpdate((balance) => {
      this.state.balance = balance;
      this.notifyStateChange();
    });
  }

  notifyStateChange() {
    // Notify UI of state change
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  getState() {
    return { ...this.state };
  }
}

// Usage
const stateManager = new GameStateManager(game);
stateManager.onStateChange = (state) => {
  console.log('State updated:', state);
  updateUI(state);
};
```

---

## Animation Timing

### Recommended Timing

```javascript
const ANIMATION_TIMING = {
  // Reel spinning
  SPIN_START_DELAY: 100,        // Delay before starting spin
  SPIN_DURATION_MIN: 2000,      // Minimum spin time (feels good)
  REEL_STOP_STAGGER: 150,       // Delay between each reel stopping

  // Win celebration
  WIN_DISPLAY_DURATION: 3000,   // How long to show win amount
  PAYLINE_FLASH_DURATION: 500,  // How long each payline flashes
  PAYLINE_FLASH_DELAY: 300,     // Delay between payline flashes

  // Sounds
  SPIN_SOUND_DELAY: 50,
  WIN_SOUND_DELAY: 500,
};

async function animateSpinSequence(result) {
  // 1. Start spinning
  startSpinAnimation();
  await delay(ANIMATION_TIMING.SPIN_DURATION_MIN);

  // 2. Stop reels in sequence
  for (let i = 0; i < 5; i++) {
    stopReel(i, result.grid[i]);
    await delay(ANIMATION_TIMING.REEL_STOP_STAGGER);
  }

  // 3. If win, celebrate
  if (result.isWin) {
    await delay(ANIMATION_TIMING.WIN_SOUND_DELAY);
    playWinSound(result.winLevel);

    // Flash winning lines
    for (const line of result.winningLines) {
      flashPayline(line.paylineIndex);
      await delay(ANIMATION_TIMING.PAYLINE_FLASH_DELAY);
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
game.onError((error) => {
  console.error('Game error:', error);

  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      showDepositDialog();
      break;
    case 'NETWORK_ERROR':
      showRetryDialog();
      break;
    default:
      showGenericError(error.message);
  }
});
```

### 2. Disable Spin Button While Spinning

```javascript
let spinning = false;

async function spin() {
  if (spinning) return;

  spinning = true;
  disableSpinButton();

  try {
    await game.spin(betAmount, paylines);
  } finally {
    spinning = false;
    enableSpinButton();
  }
}
```

### 3. Show Balance Updates

```javascript
game.onBalanceUpdate((newBalance, oldBalance) => {
  const change = newBalance - oldBalance;

  // Animate the change
  if (change > 0) {
    showBalanceIncrease(change);
  } else if (change < 0) {
    showBalanceDecrease(Math.abs(change));
  }

  // Update display
  updateBalanceDisplay(newBalance);
});
```

### 4. Validate Before Spinning

```javascript
async function spin() {
  const state = game.getState();

  // Check balance
  if (state.availableBalance < totalBet) {
    showError('Insufficient balance');
    return;
  }

  // Check if already spinning
  if (state.isSpinning) {
    return;
  }

  // All good, spin!
  await game.spin(betAmount, paylines);
}
```

### 5. Handle Network Issues

```javascript
let retryCount = 0;
const MAX_RETRIES = 3;

async function spinWithRetry() {
  try {
    await game.spin(betAmount, paylines);
    retryCount = 0; // Reset on success
  } catch (error) {
    if (error.code === 'NETWORK_ERROR' && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying (${retryCount}/${MAX_RETRIES})...`);
      await delay(2000);
      return spinWithRetry();
    } else {
      throw error;
    }
  }
}
```

### 6. Preload Assets

```javascript
async function preloadAssets() {
  const assets = [
    'symbol_A.png',
    'symbol_B.png',
    'symbol_C.png',
    'symbol_D.png',
    'spin.mp3',
    'win.mp3'
  ];

  await Promise.all(assets.map(loadAsset));
  console.log('Assets loaded');
}

function loadAsset(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}
```

---

## Summary

**Key Integration Steps:**

1. ✅ Initialize engine with `game.initialize()`
2. ✅ Set up event listeners (`onOutcome`, `onBalanceUpdate`, `onError`)
3. ✅ Call `game.spin()` when player clicks spin
4. ✅ Animate reels in `onOutcome()` callback
5. ✅ Handle errors gracefully
6. ✅ Update UI reactively

**Remember:**
- Always wait for `initialize()` before spinning
- Handle all errors (network, balance, etc.)
- Disable spin button while spinning
- Animate reels smoothly (2-3 second minimum)
- Celebrate wins appropriately (based on win level)


