import { z } from 'zod';

/**
 * Schema for profile updates
 */
export const UpdateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name must be at least 1 character')
    .max(50, 'Display name must be less than 50 characters')
    .nullable()
    .optional(),
  avatar_url: z
    .string()
    .url('Avatar URL must be a valid URL')
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Schema for profile response (what we send to client)
 */
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  primary_email: z.string().email(),
  display_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Schema for account response
 */
export const AccountResponseSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  chain: z.enum(['base', 'voi', 'solana']),
  address: z.string(),
  wallet_provider: z.enum(['coinbase-embedded', 'extern']),
  is_primary: z.boolean(),
  derived_from_chain: z.enum(['base', 'voi', 'solana']).nullable(),
  derived_from_address: z.string().nullable(),
  created_at: z.string(),
});

/**
 * Schema for complete profile with accounts response
 */
export const ProfileWithAccountsResponseSchema = z.object({
  profile: ProfileResponseSchema,
  accounts: z.array(AccountResponseSchema),
  primaryAccount: AccountResponseSchema.nullable(),
});
