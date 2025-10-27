type SupportedChain = 'base' | 'voi' | 'solana';

const STYLES: Record<SupportedChain, string> = {
  base: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  voi: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
  solana: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
};

const LABELS: Record<SupportedChain, string> = {
  base: 'Base',
  voi: 'Voi',
  solana: 'Solana',
};

const FALLBACK_STYLE = 'bg-neutral-800 text-neutral-400';

export default function ChainBadge({ chain }: { chain?: SupportedChain | 'unknown' | null }) {
  if (!chain || chain === 'unknown') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${FALLBACK_STYLE}`}>
        Unknown
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STYLES[chain]}`}>
      {LABELS[chain]}
    </span>
  );
}
