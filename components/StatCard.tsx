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
    <div className="card p-6 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950 dark:text-white">{value}</p>
          {subtitle && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
        </div>
        {icon && <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 p-3 rounded-xl">{icon}</div>}
      </div>
    </div>
  );
}
