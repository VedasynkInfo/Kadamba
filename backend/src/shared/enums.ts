/**
 * Single source of truth for domain enums shared by the backend API and the
 * frontend SPA.
 *
 * Both apps import from this file so a status/role/method can never drift out
 * of sync between the database, the API and the UI.
 *
 * This module is intentionally dependency-free and side-effect free.
 */

/* -------------------------------------------------------------------------- */
/* Auth & roles                                                               */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ['admin', 'user', 'customer', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles allowed into the studio admin console. */
export const ADMIN_CONSOLE_ROLES = ['admin', 'staff'] as const;

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Fine-grained capabilities for studio staff. `admin` implicitly holds `*`.
 * Permissions are stored per-user so a stitcher can be given order access
 * without also seeing the financial ledger.
 */
export const PERMISSIONS = [
  'orders:read',
  'orders:write',
  'customers:read',
  'customers:write',
  'leads:read',
  'leads:write',
  'measurements:read',
  'measurements:write',
  'finance:read',
  'finance:write',
  'staff:read',
  'staff:write',
  'catalog:read',
  'catalog:write',
  'media:read',
  'media:write',
  'content:write',
  'reports:read',
  'users:manage',
  'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Human labels + grouping for the Users & Roles desk. */
export const PERMISSION_GROUPS: ReadonlyArray<{
  group: string;
  permissions: ReadonlyArray<{ key: Permission; label: string }>;
}> = [
  {
    group: 'Orders',
    permissions: [
      { key: 'orders:read', label: 'View orders' },
      { key: 'orders:write', label: 'Create & update orders' },
    ],
  },
  {
    group: 'Customers',
    permissions: [
      { key: 'customers:read', label: 'View customers' },
      { key: 'customers:write', label: 'Edit customers' },
    ],
  },
  {
    group: 'Leads',
    permissions: [
      { key: 'leads:read', label: 'View leads' },
      { key: 'leads:write', label: 'Manage leads' },
    ],
  },
  {
    group: 'Measurements',
    permissions: [
      { key: 'measurements:read', label: 'View measurements' },
      { key: 'measurements:write', label: 'Edit measurements' },
    ],
  },
  {
    group: 'Finance',
    permissions: [
      { key: 'finance:read', label: 'View payments & expenses' },
      { key: 'finance:write', label: 'Record payments & expenses' },
    ],
  },
  {
    group: 'Team',
    permissions: [
      { key: 'staff:read', label: 'View staff' },
      { key: 'staff:write', label: 'Manage staff' },
    ],
  },
  {
    group: 'Catalog',
    permissions: [
      { key: 'catalog:read', label: 'View catalog' },
      { key: 'catalog:write', label: 'Edit catalog' },
    ],
  },
  {
    group: 'Media',
    permissions: [
      { key: 'media:read', label: 'Browse the media library' },
      { key: 'media:write', label: 'Upload, edit & delete media' },
    ],
  },
  {
    group: 'Content & reports',
    permissions: [
      { key: 'content:write', label: 'Edit website content' },
      { key: 'reports:read', label: 'View reports' },
    ],
  },
  {
    group: 'Administration',
    permissions: [
      { key: 'users:manage', label: 'Manage users & roles' },
      { key: 'audit:read', label: 'View audit log' },
    ],
  },
];

/** Sensible starting point for a new staff account (least privilege). */
export const DEFAULT_STAFF_PERMISSIONS: readonly Permission[] = [
  'orders:read',
  'orders:write',
  'customers:read',
  'leads:read',
  'measurements:read',
  'measurements:write',
  'catalog:read',
  'media:read',
];

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUSES = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
  'cancelled',
  'on_hold',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy-path production order (excludes cancelled / on_hold). */
export const ORDER_PRODUCTION_FLOW = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
] as const satisfies readonly OrderStatus[];

export const ORDER_PRIORITIES = ['normal', 'high', 'rush'] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export const ORDER_STAFF_ROLES = [
  'cutter',
  'stitcher',
  'maggam',
  'finishing',
  'designer',
] as const;
export type OrderStaffRole = (typeof ORDER_STAFF_ROLES)[number];

/** Allowed status transitions. Enforced server-side; mirrored in the UI. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  enquiry: ['confirmed', 'cancelled', 'on_hold'],
  confirmed: ['measurements', 'cutting', 'cancelled', 'on_hold'],
  measurements: ['cutting', 'cancelled', 'on_hold'],
  cutting: ['stitching', 'embroidery_maggam', 'cancelled', 'on_hold'],
  stitching: ['embroidery_maggam', 'trial', 'finishing', 'cancelled', 'on_hold'],
  embroidery_maggam: ['trial', 'finishing', 'cancelled', 'on_hold'],
  trial: ['finishing', 'stitching', 'cancelled', 'on_hold'],
  finishing: ['delivery', 'trial', 'cancelled', 'on_hold'],
  delivery: [],
  cancelled: ['enquiry'],
  on_hold: ['enquiry', 'confirmed', 'cancelled'],
};

/* -------------------------------------------------------------------------- */
/* Leads / CRM                                                                */
/* -------------------------------------------------------------------------- */

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Appointment',
  'Completed',
  'Rejected',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  'Request Service',
  'Contact',
  'WhatsApp',
  'Walk-in',
  'Referral',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_QUALITIES = ['hot', 'warm', 'cold'] as const;
export type LeadQuality = (typeof LEAD_QUALITIES)[number];

export const FOLLOW_UP_TYPES = [
  'call',
  'whatsapp',
  'email',
  'in_person_consultation',
] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const FOLLOW_UP_STATUSES = [
  'pending',
  'completed',
  'cancelled',
  'rescheduled',
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Measurements                                                               */
/* -------------------------------------------------------------------------- */

export const MEASUREMENT_STATUSES = [
  'draft',
  'active',
  'archived',
  'pending_approval',
] as const;
export type MeasurementStatus = (typeof MEASUREMENT_STATUSES)[number];

export const MEASUREMENT_UNITS = ['in', 'cm'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

/* -------------------------------------------------------------------------- */
/* Staff                                                                      */
/* -------------------------------------------------------------------------- */

export const STAFF_STATUSES = ['active', 'inactive'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const EMPLOYMENT_TYPES = ['permanent', 'freelance', 'intern'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const SALARY_TYPES = ['monthly', 'daily', 'per_piece'] as const;
export type SalaryType = (typeof SALARY_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* Finance                                                                    */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXPENSE_CATEGORIES = [
  'rent',
  'materials',
  'utilities',
  'marketing',
  'salary',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/* -------------------------------------------------------------------------- */
/* Shared API envelope                                                        */
/* -------------------------------------------------------------------------- */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Machine-readable error codes so the UI can localise without string matching. */
export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'FORBIDDEN',
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'UPLOAD_INVALID',
  'INTERNAL',
  'MFA_REQUIRED',
  'MFA_INVALID',
  'ACCOUNT_LOCKED',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * HTTP status → error code, for the many handlers that do not name a code.
 * Specific cases (lockout, MFA, uploads, rate limits) pass an explicit code.
 */
export function defaultErrorCode(statusCode: number): ErrorCode {
  if (statusCode === 401) return 'UNAUTHENTICATED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 422) return 'VALIDATION_FAILED';
  if (statusCode === 423) return 'ACCOUNT_LOCKED';
  if (statusCode === 429) return 'RATE_LIMITED';
  if (statusCode >= 500) return 'INTERNAL';
  return 'BAD_REQUEST';
}

/* -------------------------------------------------------------------------- */
/* API envelopes                                                              */
/* -------------------------------------------------------------------------- */

/** Every error response from the API has this shape. */
export interface ApiErrorResponse {
  success: false;
  /** Stable machine-readable cause; preferred over parsing `message`. */
  code: ErrorCode;
  message: string;
  /** Field-level detail (validation errors, conflicting keys, usage lists). */
  errors?: unknown[];
  /** Correlates a user-visible failure with the server logs. */
  requestId?: string;
}

/** Every success response from the API has this shape. */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

/** Every auditable admin mutation. Kept as a closed list so reports are exact. */
export const AUDIT_ACTIONS = [
  'auth.login',
  'auth.login_failed',
  'auth.logout',
  'auth.refresh_reuse_detected',
  'auth.password_changed',
  'auth.password_reset_requested',
  'auth.password_reset_completed',
  'auth.mfa_enabled',
  'auth.mfa_disabled',
  'auth.mfa_failed',
  'auth.sessions_revoked',
  'user.created',
  'user.updated',
  'user.disabled',
  'user.enabled',
  'user.permissions_changed',
  'user.password_reset',
  'order.created',
  'order.updated',
  'order.status_changed',
  'order.cancelled',
  'order.assigned',
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'lead.created',
  'lead.updated',
  'lead.converted',
  'measurement.created',
  'measurement.updated',
  'measurement.approved',
  'payment.recorded',
  'payment.overpayment_override',
  'expense.created',
  'expense.updated',
  'expense.deleted',
  'salary.recorded',
  'staff.created',
  'staff.updated',
  'catalog.created',
  'catalog.updated',
  'media.uploaded',
  'media.updated',
  'media.deleted',
  'media.variants_regenerated',
  'content.updated',
  'settings.updated',
  /**
   * Generic fallback written by `autoAudit` for an admin/staff write that did
   * not record a structured event of its own. Guarantees every mutation leaves
   * a trace instead of relying on each handler to remember.
   */
  'admin.request',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
