import { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  ref?: Ref<HTMLInputElement>;
}

export default function Input({
  className = '',
  label,
  error,
  helperText,
  type = 'text',
  ref,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full rounded-xl border-2 ${
          error
            ? 'border-error-500 focus-visible:ring-error-500 focus-visible:border-error-500'
            : 'border-neutral-300 dark:border-neutral-700 focus-visible:ring-primary-500 focus-visible:border-primary-500'
        } bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-950 dark:text-white transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-error-600 dark:text-error-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">{helperText}</p>
      )}
    </div>
  );
}
