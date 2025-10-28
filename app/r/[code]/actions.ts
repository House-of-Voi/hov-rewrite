'use server';

import { validateReferralCode } from '@/lib/referrals/validation';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { notFound } from 'next/navigation';
import type { ReferralValidationResult } from '@/lib/referrals/validation';

export async function validateAndAttributeReferral(
  code: string
): Promise<ReferralValidationResult> {
  const normalizedCode = code.toUpperCase();

  // Validate the referral code
  const validation = await validateReferralCode(normalizedCode);

  // If code doesn't exist, trigger 404
  if (!validation.valid || !validation.exists) {
    notFound();
  }

  // Update attributed_at timestamp if this is the first time the link was clicked
  if (validation.codeId) {
    const supabase = createAdminClient();
    await supabase
      .from('referral_codes')
      .update({
        attributed_at: new Date().toISOString(),
      })
      .eq('id', validation.codeId)
      .is('attributed_at', null); // Only update if not already set
  }

  return validation;
}
