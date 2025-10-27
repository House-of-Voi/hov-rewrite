export const MICRO_VOI = 1_000_000;

export const numberFrom = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const microToString = (microValue: number, fractionDigits = 8): string =>
  (microValue / MICRO_VOI).toFixed(fractionDigits);

export const microToNumber = (microValue: number): number => microValue / MICRO_VOI;

