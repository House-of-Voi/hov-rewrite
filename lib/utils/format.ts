/**
 * Format a number in a compact way (e.g., 1.2K, 3.5M)
 */
export function formatNumberCompact(num: number): string {
  if (num === 0) return '0';
  if (num < 1000) return num.toString();

  const units = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (magnitude >= units.length) {
    return num.toExponential(2);
  }

  const scaled = num / Math.pow(1000, magnitude);
  const formatted = scaled < 10 ? scaled.toFixed(1) : scaled.toFixed(0);

  return `${formatted}${units[magnitude]}`;
}

/**
 * Format a large currency value (typically in microVOI)
 */
export function formatCurrency(microVoi: number): string {
  const voi = microVoi / 1_000_000;

  if (voi === 0) return '$0';
  if (voi < 0.01) return `$${voi.toExponential(2)}`;
  if (voi < 1000) return `$${voi.toFixed(2)}`;

  return `$${formatNumberCompact(voi)}`;
}

/**
 * Format percentage with fixed decimal places
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a timestamp to a human-readable date string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a large number with commas
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format VOI amount (divide by 1M and add 2 decimals)
 */
export function formatVoi(microVoi: number | string, decimals = 2): string {
  let voi: number;

  if (typeof microVoi === 'string') {
    // String - try to parse as BigInt first, then divide
    try {
      const num = BigInt(microVoi);
      voi = Number(num) / 1_000_000;
    } catch {
      // If it fails, parse as number
      voi = Number(microVoi) / 1_000_000;
    }
  } else {
    // Already a number - just divide
    voi = microVoi / 1_000_000;
  }

  return voi.toFixed(decimals);
}

/**
 * Truncate an address for display (e.g., "VOI1...XYZ")
 */
export function truncateAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
