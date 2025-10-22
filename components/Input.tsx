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
        <label className="block text-sm font-medium text-gold-400 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full rounded-xl border-2 ${
          error
            ? 'border-ruby-500 focus-visible:ring-ruby-500 focus-visible:border-ruby-500'
            : 'border-neutral-800 focus-visible:ring-gold-500 focus-visible:border-gold-500'
        } bg-neutral-900 px-4 py-3 text-sm text-neutral-100 transition-all placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-ruby-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}
