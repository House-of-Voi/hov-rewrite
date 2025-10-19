'use client';
import { useState } from 'react';

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-sm rounded-lg border-2 border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors font-semibold uppercase tracking-wide"
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}
