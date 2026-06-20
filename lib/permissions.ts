/**
 * Permission system for FusionZone staff access control.
 * All permissions are enforced server-side.
 */

import { UserRole } from "@/lib/enums";

// ============== PERMISSION KEYS ==============

export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_VIEW_FINANCIAL_SUMMARY: "dashboard:view_financial_summary",

  // Orders
  ORDERS_VIEW: "orders:view",
  ORDERS_CREATE: "orders:create",
  ORDERS_UPDATE: "orders:update",
  ORDERS_CANCEL: "orders:cancel",
  ORDERS_DELETE: "orders:delete",

  // Products & Inventory
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  PRODUCTS_MANAGE_STOCK: "products:manage_stock",

  // Categories & Brands
  CATEGORIES_VIEW: "categories:view",
  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_UPDATE: "categories:update",
  CATEGORIES_DELETE: "categories:delete",
  BRANDS_VIEW: "brands:view",
  BRANDS_CREATE: "brands:create",
  BRANDS_UPDATE: "brands:update",
  BRANDS_DELETE: "brands:delete",

  // Promotions
  PROMOTIONS_VIEW: "promotions:view",
  PROMOTIONS_CREATE: "promotions:create",
  PROMOTIONS_UPDATE: "promotions:update",
  PROMOTIONS_DELETE: "promotions:delete",

  // Customers
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_EXPORT: "customers:export",

  // Payments
  PAYMENTS_VIEW: "payments:view",
  PAYMENTS_CREATE: "payments:create",
  PAYMENTS_UPDATE: "payments:update",
  PAYMENTS_REFUND: "payments:refund",
  PAYMENTS_EXPORT: "payments:export",
  PAYMENTS_REMOVE: "payments:remove",

  // Documents (Receipts, Quotations)
  DOCUMENTS_VIEW: "documents:view",
  DOCUMENTS_CREATE: "documents:create",
  DOCUMENTS_UPDATE: "documents:update",
  DOCUMENTS_SEND: "documents:send",
  DOCUMENTS_DELETE: "documents:delete",

  // Follow-ups
  FOLLOWUPS_VIEW: "followups:view",
  FOLLOWUPS_CREATE: "followups:create",
  FOLLOWUPS_UPDATE: "followups:update",
  FOLLOWUPS_DELETE: "followups:delete",

  // Stock Requests
  STOCK_REQUESTS_VIEW: "stockRequests:view",
  STOCK_REQUESTS_UPDATE: "stockRequests:update",
  STOCK_REQUESTS_DELETE: "stockRequests:delete",
  STOCK_REQUESTS_EXPORT: "stockRequests:export",

  // Users (Staff Management)
  USERS_VIEW: "users:view",
  USERS_INVITE: "users:invite",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_ASSIGN_ROLES: "users:assign_roles",
  USERS_MANAGE_PERMISSIONS: "users:manage_permissions",
  USERS_SUSPEND: "users:suspend",
  USERS_DISABLE: "users:disable",
  USERS_DELETE: "users:delete",

  // Notifications
  NOTIFICATIONS_VIEW: "notifications:view",
  NOTIFICATIONS_MANAGE: "notifications:manage",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",

  // Audit Log
  AUDIT_LOGS_VIEW: "auditLogs:view",
  AUDIT_LOGS_EXPORT: "auditLogs:export",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// ============== ROLE-BASED DEFAULT PERMISSIONS ==============

/**
 * Default permissions for each role.
 * OWNER gets all permissions implicitly.
 * ADMIN gets most permissions except sensitive staff management.
 * STAFF gets minimal permissions that can be expanded.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: Object.values(Permissions),
  [UserRole.ADMIN]: [
    // Dashboard — only operational stats by default
    Permissions.DASHBOARD_VIEW,
    // Orders
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_CREATE,
    Permissions.ORDERS_UPDATE,
    Permissions.ORDERS_CANCEL,
    // Products & Inventory
    Permissions.PRODUCTS_VIEW,
    Permissions.PRODUCTS_CREATE,
    Permissions.PRODUCTS_UPDATE,
    Permissions.PRODUCTS_DELETE,
    Permissions.PRODUCTS_MANAGE_STOCK,
    // Categories & Brands
    Permissions.CATEGORIES_VIEW,
    Permissions.CATEGORIES_CREATE,
    Permissions.CATEGORIES_UPDATE,
    Permissions.CATEGORIES_DELETE,
    Permissions.BRANDS_VIEW,
    Permissions.BRANDS_CREATE,
    Permissions.BRANDS_UPDATE,
    Permissions.BRANDS_DELETE,
    // Promotions
    Permissions.PROMOTIONS_VIEW,
    Permissions.PROMOTIONS_CREATE,
    Permissions.PROMOTIONS_UPDATE,
    Permissions.PROMOTIONS_DELETE,
    // Customers
    Permissions.CUSTOMERS_VIEW,
    Permissions.CUSTOMERS_UPDATE,
    Permissions.CUSTOMERS_EXPORT,
    // Documents
    Permissions.DOCUMENTS_VIEW,
    Permissions.DOCUMENTS_CREATE,
    Permissions.DOCUMENTS_UPDATE,
    Permissions.DOCUMENTS_SEND,
    Permissions.DOCUMENTS_DELETE,
    // Follow-ups
    Permissions.FOLLOWUPS_VIEW,
    Permissions.FOLLOWUPS_CREATE,
    Permissions.FOLLOWUPS_UPDATE,
    Permissions.FOLLOWUPS_DELETE,
    // Stock Requests
    Permissions.STOCK_REQUESTS_VIEW,
    Permissions.STOCK_REQUESTS_UPDATE,
    Permissions.STOCK_REQUESTS_DELETE,
    Permissions.STOCK_REQUESTS_EXPORT,
    // Notifications
    Permissions.NOTIFICATIONS_VIEW,
    Permissions.NOTIFICATIONS_MANAGE,
    // Settings — view only by default
    Permissions.SETTINGS_VIEW,
    // Audit Log — view only by default
    Permissions.AUDIT_LOGS_VIEW,
    // Sensitive permissions NOT included by default:
    // Users: view/invite/create/edit/roles/permissions/suspend/disable/delete
    // Payments: view/create/update/refund/export/remove
    // Dashboard: view_financial_summary
    // Settings: update
    // Audit Log: export
  ],
  [UserRole.STAFF]: [
    Permissions.DASHBOARD_VIEW,
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_UPDATE,
    Permissions.PRODUCTS_VIEW,
    Permissions.CUSTOMERS_VIEW,
    Permissions.DOCUMENTS_VIEW,
    Permissions.FOLLOWUPS_VIEW,
    Permissions.FOLLOWUPS_CREATE,
    Permissions.FOLLOWUPS_UPDATE,
    Permissions.STOCK_REQUESTS_VIEW,
    Permissions.NOTIFICATIONS_VIEW,
    Permissions.SETTINGS_VIEW,
    // No financial/management/user permissions by default
  ],
};

// ============== PERMISSION HELPERS ==============

/**
 * Check if a user has a specific permission.
 * OWNER always has all permissions.
 */
export function hasPermission(
  userRole: UserRole,
  userPermissions: Permission[] | null | undefined,
  permission: Permission
): boolean {
  // OWNER has all permissions
  if (userRole === UserRole.OWNER) return true;

  // Check explicit permissions
  if (userPermissions?.includes(permission)) return true;

  // Check default role permissions
  return DEFAULT_ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions.
 */
export function hasAnyPermission(
  userRole: UserRole,
  userPermissions: Permission[] | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(userRole, userPermissions, p));
}

/**
 * Check if a user has all of the specified permissions.
 */
export function hasAllPermissions(
  userRole: UserRole,
  userPermissions: Permission[] | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(userRole, userPermissions, p));
}

/**
 * Get all permissions for a user, combining role defaults with explicit permissions.
 */
export function getUserPermissions(
  userRole: UserRole,
  explicitPermissions: Permission[] | null | undefined
): Permission[] {
  if (userRole === UserRole.OWNER) {
    return Object.values(Permissions);
  }

  const defaults = DEFAULT_ROLE_PERMISSIONS[userRole] ?? [];
  const explicit = explicitPermissions ?? [];

  // Combine and deduplicate
  return Array.from(new Set([...defaults, ...explicit]));
}

// ============== SERVER-SIDE AUTHORIZATION ==============

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

/**
 * Require a specific role. Throws if user doesn't have the role.
 * OWNER passes all role checks.
 */
export function requireRole(
  auth: AuthContext,
  requiredRole: UserRole | UserRole[]
): void {
  // OWNER can access anything
  if (auth.role === UserRole.OWNER) return;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(auth.role)) {
    throw new Error("Insufficient role privileges");
  }
}

/**
 * Require a specific permission. Throws if user doesn't have the permission.
 */
export function requirePermission(
  auth: AuthContext,
  permission: Permission
): void {
  if (!hasPermission(auth.role, auth.permissions, permission)) {
    throw new Error("Insufficient permissions");
  }
}

/**
 * Check permission and return boolean (for guards).
 */
export function can(
  auth: AuthContext,
  permission: Permission
): boolean {
  return hasPermission(auth.role, auth.permissions, permission);
}

// ============== UI NAVIGATION CONFIGURATION ==============

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredPermission: Permission;
  subItems?: NavItem[];
}

/**
 * Dashboard navigation configuration.
 * Items are filtered based on user permissions.
 */
export const DASHBOARD_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    requiredPermission: Permissions.DASHBOARD_VIEW,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: "ShoppingCart",
    requiredPermission: Permissions.ORDERS_VIEW,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: "Package",
    requiredPermission: Permissions.PRODUCTS_VIEW,
    subItems: [
      {
        label: "All Products",
        href: "/dashboard/products",
        icon: "List",
        requiredPermission: Permissions.PRODUCTS_VIEW,
      },
      {
        label: "Categories",
        href: "/dashboard/categories",
        icon: "Tags",
        requiredPermission: Permissions.CATEGORIES_VIEW,
      },
      {
        label: "Brands",
        href: "/dashboard/brands",
        icon: "Award",
        requiredPermission: Permissions.BRANDS_VIEW,
      },
    ],
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: "Users",
    requiredPermission: Permissions.CUSTOMERS_VIEW,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: "CreditCard",
    requiredPermission: Permissions.PAYMENTS_VIEW,
  },
  {
    label: "Quotations",
    href: "/dashboard/quotations",
    icon: "FileText",
    requiredPermission: Permissions.DOCUMENTS_VIEW,
  },
  {
    label: "Receipts",
    href: "/dashboard/receipts",
    icon: "Receipt",
    requiredPermission: Permissions.DOCUMENTS_VIEW,
  },
  {
    label: "Follow-ups",
    href: "/dashboard/follow-ups",
    icon: "Phone",
    requiredPermission: Permissions.FOLLOWUPS_VIEW,
  },
  {
    label: "Back in Stock",
    href: "/dashboard/back-in-stock",
    icon: "Bell",
    requiredPermission: Permissions.STOCK_REQUESTS_VIEW,
  },
  {
    label: "Promotions",
    href: "/dashboard/promotions",
    icon: "Percent",
    requiredPermission: Permissions.PROMOTIONS_VIEW,
  },
  {
    label: "Users",
    href: "/dashboard/staff",
    icon: "UserCog",
    requiredPermission: Permissions.USERS_VIEW,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: "BellDot",
    requiredPermission: Permissions.NOTIFICATIONS_VIEW,
  },
  {
    label: "Audit Log",
    href: "/dashboard/audit-log",
    icon: "ClipboardList",
    requiredPermission: Permissions.AUDIT_LOGS_VIEW,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    requiredPermission: Permissions.SETTINGS_VIEW,
  },
];

// ============== API ENDPOINT PROTECTION ==============

/**
 * Middleware helper to check permissions in API routes.
 */
export function withPermission(
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>,
  requiredPermission: Permission
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Auth will be extracted from session in the handler
    // This is a placeholder for the wrapper pattern
    return handler(req, {} as AuthContext);
  };
}
