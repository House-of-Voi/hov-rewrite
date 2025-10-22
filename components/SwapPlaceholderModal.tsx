'use client';

import Modal from './Modal';

interface SwapPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol: string;
  action: 'deposit' | 'withdraw';
}

export default function SwapPlaceholderModal({
  isOpen,
  onClose,
  tokenSymbol,
  action,
}: SwapPlaceholderModalProps) {
  const actionText = action === 'deposit' ? 'Deposit' : 'Withdraw';
  const swapDirection = action === 'deposit' ? 'USDC → ' : ' → USDC';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-2xl font-black text-gold-400 uppercase">
            {actionText} {tokenSymbol}
          </h2>
          <p className="text-neutral-400 mt-2">Coming Soon!</p>
        </div>

        {/* Content */}
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-neutral-300 mb-4">
              This feature will allow you to {action === 'deposit' ? 'convert USDC to' : 'convert'} {tokenSymbol}
              {action === 'withdraw' ? ' to USDC' : ''} seamlessly.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 bg-neutral-900/50 rounded-lg border border-gold-500/20">
              <span className="font-mono font-bold text-blue-400">
                {action === 'deposit' ? 'USDC' : tokenSymbol}
              </span>
              <span className="text-2xl text-gold-400">→</span>
              <span className="font-mono font-bold text-purple-400">
                {action === 'deposit' ? tokenSymbol : 'USDC'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-neutral-400">
            <p className="flex items-start gap-2">
              <span className="text-gold-400">✓</span>
              <span>Automatic swapping using on-chain DEX</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-gold-400">✓</span>
              <span>Best rates guaranteed</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-gold-400">✓</span>
              <span>Instant transfers to your wallet</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-neutral-950 font-black uppercase tracking-wide rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all"
          >
            Got It
          </button>
          <p className="text-xs text-neutral-600 mt-4">
            We&apos;re working hard to bring you this feature. Stay tuned!
          </p>
        </div>
      </div>
    </Modal>
  );
}
