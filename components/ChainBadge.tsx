export default function ChainBadge({ chain }: { chain: 'base' | 'voi' | 'solana' }) {
  const styles = {
    base: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    voi: 'bg-royal-500/20 text-royal-400 border border-royal-500/30',
    solana: 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  const labels = {
    base: 'Base',
    voi: 'Voi',
    solana: 'Solana',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[chain]}`}>
      {labels[chain]}
    </span>
  );
}
