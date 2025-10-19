import { ReactNode } from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="casino-card p-6 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-500 uppercase tracking-wider font-bold">{title}</p>
          <p className="mt-3 text-4xl font-black text-gold-400">{value}</p>
          {subtitle && <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-gold-400">{icon}</div>}
      </div>
    </div>
  );
}
