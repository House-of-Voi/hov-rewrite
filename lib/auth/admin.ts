/**
 * Admin authorization and permission management
 * Implements role-based access control with granular permissions
 */

import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getServerSessionFromRequest } from './session';
import {
  getEffectivePermissions,
  type Permission,
  type AdminRole,
  type AdminRoleData,
} from './permissions';

// Re-export for convenience
export { getEffectivePermissions, PERMISSIONS, type Permission, type AdminRole, type AdminRoleData } from './permissions';

/**
 * Get the current user's admin role and permissions
 */
export async function getAdminRole(profileId?: string): Promise<AdminRoleData | null> {
  try {
    let currentProfileId = profileId;

    // If no profile ID provided, get it from session
    if (!currentProfileId) {
      const session = await getServerSessionFromRequest();
      if (!session) {
        return null;
      }
      currentProfileId = session.profileId;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('profile_id', currentProfileId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AdminRoleData;
  } catch (error) {
    console.error('Error getting admin role:', error);
    return null;
  }
}

/**
 * Check if current user is an admin (has any admin role)
 */
export async function isAdmin(profileId?: string): Promise<boolean> {
  const role = await getAdminRole(profileId);
  return role !== null;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  permission: Permission,
  profileId?: string
): Promise<boolean> {
  const roleData = await getAdminRole(profileId);
  if (!roleData) {
    return false;
  }

  const effectivePerms = getEffectivePermissions(roleData);
  return effectivePerms.includes(permission);
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  permissions: Permission[],
  profileId?: string
): Promise<boolean> {
  const roleData = await getAdminRole(profileId);
  if (!roleData) {
    return false;
  }

  const effectivePerms = getEffectivePermissions(roleData);
  return permissions.every(p => effectivePerms.includes(p));
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  permissions: Permission[],
  profileId?: string
): Promise<boolean> {
  const roleData = await getAdminRole(profileId);
  if (!roleData) {
    return false;
  }

  const effectivePerms = getEffectivePermissions(roleData);
  return permissions.some(p => effectivePerms.includes(p));
}

/**
 * Require admin role - throws if user is not an admin
 * Use in API routes to protect admin endpoints
 */
export async function requireAdmin(profileId?: string): Promise<AdminRoleData> {
  const roleData = await getAdminRole(profileId);

  if (!roleData) {
    throw new Error('UNAUTHORIZED: Admin access required');
  }

  return roleData;
}

/**
 * Require specific permission - throws if user doesn't have it
 * Use in API routes to protect specific admin actions
 */
export async function requirePermission(
  permission: Permission,
  profileId?: string
): Promise<AdminRoleData> {
  const roleData = await requireAdmin(profileId);
  const effectivePerms = getEffectivePermissions(roleData);

  if (!effectivePerms.includes(permission)) {
    throw new Error(`FORBIDDEN: Missing required permission: ${permission}`);
  }

  return roleData;
}

/**
 * Require specific role - throws if user doesn't have the required role level
 */
export async function requireRole(
  requiredRole: AdminRole,
  profileId?: string
): Promise<AdminRoleData> {
  const roleData = await requireAdmin(profileId);

  const roleHierarchy: Record<AdminRole, number> = {
    viewer: 1,
    operator: 2,
    owner: 3,
  };

  if (roleHierarchy[roleData.role] < roleHierarchy[requiredRole]) {
    throw new Error(`FORBIDDEN: Required role: ${requiredRole}, current role: ${roleData.role}`);
  }

  return roleData;
}

/**
 * Get current profile ID from session cookie
 */
export async function getCurrentProfileId(): Promise<string | null> {
  try {
    const session = await getServerSessionFromRequest();
    return session?.profileId || null;
  } catch (error) {
    console.error('Error getting current profile ID:', error);
    return null;
  }
}
