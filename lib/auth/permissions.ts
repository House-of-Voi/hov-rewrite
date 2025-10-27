/**
 * Shared permission utilities
 * Can be used in both client and server components
 */

// Permission constants
export const PERMISSIONS = {
  // Player management
  VIEW_PLAYERS: 'view_players',
  EDIT_PLAYERS: 'edit_players',
  GRANT_ACCESS: 'grant_access',
  MANAGE_WAITLIST: 'manage_waitlist',

  // Game management
  VIEW_GAMES: 'view_games',
  EDIT_GAMES: 'edit_games',
  CREATE_GAMES: 'create_games',
  DELETE_GAMES: 'delete_games',

  // Referral management
  VIEW_REFERRALS: 'view_referrals',
  MANAGE_REFERRALS: 'manage_referrals',

  // Analytics & Treasury
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_TREASURY: 'view_treasury',
  MANAGE_TREASURY: 'manage_treasury',

  // Admin management
  MANAGE_ADMINS: 'manage_admins',
  VIEW_AUDIT_LOG: 'view_audit_log',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Admin role type from database enum
export type AdminRole = 'owner' | 'operator' | 'viewer';

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<AdminRole, Permission[]> = {
  owner: Object.values(PERMISSIONS), // All permissions
  operator: [
    PERMISSIONS.VIEW_PLAYERS,
    PERMISSIONS.EDIT_PLAYERS,
    PERMISSIONS.GRANT_ACCESS,
    PERMISSIONS.MANAGE_WAITLIST,
    PERMISSIONS.VIEW_GAMES,
    PERMISSIONS.EDIT_GAMES,
    PERMISSIONS.CREATE_GAMES,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.MANAGE_REFERRALS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TREASURY,
  ],
  viewer: [
    PERMISSIONS.VIEW_PLAYERS,
    PERMISSIONS.VIEW_GAMES,
    PERMISSIONS.VIEW_REFERRALS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TREASURY,
  ],
};

export interface AdminRoleData {
  profile_id: string;
  role: AdminRole;
  permissions: Record<string, boolean>;
  granted_by: string | null;
  granted_at: string;
}

/**
 * Get effective permissions for a user (combines default + custom)
 * This function is pure and can be used in both client and server components
 */
export function getEffectivePermissions(roleData: AdminRoleData): Permission[] {
  const defaultPerms = DEFAULT_PERMISSIONS[roleData.role] || [];
  const customPerms = roleData.permissions || {};

  // Start with default permissions for the role
  const effectivePerms = new Set<Permission>(defaultPerms);

  // Apply custom permission overrides
  for (const [perm, enabled] of Object.entries(customPerms)) {
    if (enabled) {
      effectivePerms.add(perm as Permission);
    } else {
      effectivePerms.delete(perm as Permission);
    }
  }

  return Array.from(effectivePerms);
}
