import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/profile/session';

/**
 * GET /api/profile/accounts
 *
 * Returns all accounts linked to the current authenticated user
 *
 * Response includes:
 * - All blockchain accounts (Base, Voi, Solana)
 * - Derivation information (which accounts were derived from which)
 * - Primary account designation
 */
export async function GET() {
  try {
    const profileData = await getCurrentProfile();

    if (!profileData) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts: profileData.accounts,
        primaryAccount: profileData.primaryAccount,
      },
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
