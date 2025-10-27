export default function ChainBadge({ chain }: { chain: 'base' | 'voi' | 'solana' }) {
  const styles = {
    base: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    voi: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
    solana: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
  };

  const labels = {
    base: 'Base',
    voi: 'Voi',
    solana: 'Solana',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[chain]}`}>
      {labels[chain]}
    </span>
  );
}
