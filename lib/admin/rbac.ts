// lib/admin/rbac.ts
// Role-Based Access Control

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

export interface Permission {
  resource: string;
  actions: string[]; // 'create', 'read', 'update', 'delete'
}

export interface RolePermissions {
  tools: Permission;
  users: Permission;
  settings: Permission;
  analytics: Permission;
  payments: Permission;
}

const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  [Role.SUPER_ADMIN]: {
    tools: { resource: 'tools', actions: ['create', 'read', 'update', 'delete'] },
    users: { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    settings: { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] },
    analytics: { resource: 'analytics', actions: ['read'] },
    payments: { resource: 'payments', actions: ['read', 'update'] },
  },
  [Role.ADMIN]: {
    tools: { resource: 'tools', actions: ['read', 'update'] },
    users: { resource: 'users', actions: ['read', 'update'] },
    settings: { resource: 'settings', actions: ['read', 'update'] },
    analytics: { resource: 'analytics', actions: ['read'] },
    payments: { resource: 'payments', actions: ['read'] },
  },
  [Role.EDITOR]: {
    tools: { resource: 'tools', actions: ['read', 'update'] },
    users: { resource: 'users', actions: ['read'] },
    settings: { resource: 'settings', actions: ['read'] },
    analytics: { resource: 'analytics', actions: ['read'] },
    payments: { resource: 'payments', actions: [] },
  },
  [Role.USER]: {
    tools: { resource: 'tools', actions: ['read'] },
    users: { resource: 'users', actions: ['read'] }, // self only
    settings: { resource: 'settings', actions: ['read'] },
    analytics: { resource: 'analytics', actions: [] },
    payments: { resource: 'payments', actions: ['read'] }, // self only
  },
};

export class RBAC {
  static canPerformAction(role: Role, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    const perm = permissions[resource as keyof RolePermissions];
    return perm?.actions?.includes(action) || false;
  }

  static requireRole(...requiredRoles: Role[]): (role: Role) => boolean {
    return (role: Role) => requiredRoles.includes(role);
  }

  static getPermissionsForRole(role: Role): RolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[Role.USER];
  }
}