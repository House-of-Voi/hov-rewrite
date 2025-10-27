/**
 * Admin Referrals API
 * Monitor and manage referral codes and relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse, PaginatedResponse, ReferralCodeItem, ReferralFilters, ReferralStats } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_REFERRALS, profileId);

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats_only') === 'true';

    const supabase = createAdminClient();

    // If stats only requested, return aggregate statistics
    if (statsOnly) {
      const { data: allCodes } = await supabase
        .from('referral_codes')
        .select('id, deactivated_at, converted_at, attributed_at');

      const total_codes = allCodes?.length || 0;
      const active_codes = allCodes?.filter(c => !c.deactivated_at).length || 0;
      const converted_codes = allCodes?.filter(c => c.converted_at).length || 0;
      const pending_codes = allCodes?.filter(c => c.attributed_at && !c.converted_at && !c.deactivated_at).length || 0;
      const deactivated_codes = allCodes?.filter(c => c.deactivated_at).length || 0;
      const conversion_rate = total_codes > 0 ? (converted_codes / total_codes) * 100 : 0;

      // Get total credits distributed
      const { data: credits } = await supabase
        .from('referral_credits')
        .select('credit_earned');

      const total_credits_distributed = credits?.reduce(
        (sum, c) => sum + parseFloat(c.credit_earned),
        0
      ) || 0;

      const stats: ReferralStats = {
        total_codes,
        active_codes,
        converted_codes,
        pending_codes,
        deactivated_codes,
        conversion_rate,
        total_credits_distributed: total_credits_distributed.toFixed(8),
      };

      return NextResponse.json<ApiResponse<ReferralStats>>(
        { success: true, data: stats },
        { status: 200 }
      );
    }

    // Parse query parameters for list view
    const filters: ReferralFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      status: searchParams.get('status') as any || undefined,
      referrer_id: searchParams.get('referrer_id') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    const offset = (filters.page! - 1) * filters.limit!;

    // Build query for referral codes with profile information
    let query = supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        referrer_profile_id,
        referred_profile_id,
        attributed_at,
        converted_at,
        deactivated_at,
        created_at,
        referrer:profiles!referrer_profile_id (
          primary_email,
          display_name
        ),
        referred:profiles!referred_profile_id (
          primary_email,
          display_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.referrer_id) {
      query = query.eq('referrer_profile_id', filters.referrer_id);
    }

    if (filters.status) {
      switch (filters.status) {
        case 'active':
          query = query.is('deactivated_at', null).is('converted_at', null);
          break;
        case 'pending':
          query = query.is('deactivated_at', null).not('attributed_at', 'is', null).is('converted_at', null);
          break;
        case 'converted':
          query = query.not('converted_at', 'is', null);
          break;
        case 'deactivated':
          query = query.not('deactivated_at', 'is', null);
          break;
      }
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    // Apply sorting
    query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + filters.limit! - 1);

    const { data: codes, error, count } = await query;

    if (error) {
      console.error('Error fetching referral codes:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch referral codes' },
        { status: 500 }
      );
    }

    // Get credits earned for each code
    const codeIds = codes?.map(c => c.id) || [];
    const { data: creditsData } = await supabase
      .from('referral_credits')
      .select('credit_earned')
      .in('game_play_id', codeIds);

    const creditsMap = new Map<string, number>();
    creditsData?.forEach(credit => {
      // Note: This is a simplified aggregation; in production, you'd link via referral relationship
      const current = creditsMap.get(credit.credit_earned) || 0;
      creditsMap.set(credit.credit_earned, current + parseFloat(credit.credit_earned));
    });

    // Get play counts for referred users
    const referredIds = codes?.filter(c => c.referred_profile_id).map(c => c.referred_profile_id!) || [];
    const { data: playsData } = await supabase
      .from('game_plays')
      .select('profile_id')
      .in('profile_id', referredIds);

    const playsMap = new Map<string, number>();
    playsData?.forEach(play => {
      playsMap.set(play.profile_id, (playsMap.get(play.profile_id) || 0) + 1);
    });

    // Format response
    const referralCodes: ReferralCodeItem[] = (codes || []).map(code => {
      const referrer = (code.referrer as any)?.[0] || {};
      const referred = (code.referred as any)?.[0] || {};

      return {
        id: code.id,
        code: code.code,
        referrer_profile_id: code.referrer_profile_id,
        referrer_email: referrer.primary_email || '',
        referrer_display_name: referrer.display_name || null,
        referred_profile_id: code.referred_profile_id,
        referred_email: referred.primary_email || null,
        referred_display_name: referred.display_name || null,
        attributed_at: code.attributed_at,
        converted_at: code.converted_at,
        deactivated_at: code.deactivated_at,
        created_at: code.created_at,
        total_credits_earned: '0.00000000', // Would need proper aggregation
        referred_user_plays: code.referred_profile_id ? playsMap.get(code.referred_profile_id) || 0 : 0,
      };
    });

    const response: PaginatedResponse<ReferralCodeItem> = {
      data: referralCodes,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.limit!),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<ReferralCodeItem>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in referrals API:', error);

    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: error.message.includes('UNAUTHORIZED') ? 401 : 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
