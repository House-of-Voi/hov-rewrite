import { createAdminClient } from '@/lib/db/supabaseAdmin';

export const REF_COOKIE = 'hov_ref';
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30d

/**
 * Generate a unique referral code (7 characters, alphanumeric excluding confusing chars)
 * Excludes: I, L, O, 0, 1 to avoid confusion
 */
export function generateReferralCode(length = 7): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTWXYZ23456789';
  return Array.from(
    { length },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
}

/**
 * Generate a unique referral code by checking database for uniqueness
 * @param maxAttempts Maximum number of generation attempts before failing
 * @returns Unique referral code
 */
export async function generateUniqueReferralCode(
  maxAttempts = 10
): Promise<string> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode();

    // Check if code already exists
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

    // If no data found, code is unique
    if (!data) {
      return code;
    }
  }

  throw new Error(
    'Failed to generate unique referral code after maximum attempts'
  );
}

/**
 * Validate referral code format
 */
export function isValidReferralCodeFormat(code: string): boolean {
  const validPattern = /^[ABCDEFGHJKMNPQRSTWXYZ23456789]{7}$/;
  return validPattern.test(code);
}

export function fingerprint(req: Request): string {
  const ua = req.headers.get('user-agent') ?? '';
  const ip =
    'ip' in req ? ((req as Request & { ip?: string }).ip ?? '') : '';
  return hash(`${ua}::${ip}`);
}

function hash(s: string): string {
  let h = 0;
  let i = 0;
  const len = s.length;
  while (i < len) {
    h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
  }
  return Math.abs(h).toString(36);
}
