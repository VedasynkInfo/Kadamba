import type { Permission, UserRole, UserStatus } from '@/shared/enums';

// Re-export the shared domain contract so existing imports keep working while
// there is only one source of truth (backend/src/shared/enums.ts).
export type {
  ApiResponse,
  PaginationMeta,
  PaginatedData,
  UserRole,
  UserStatus,
  OrderStatus,
  OrderPriority,
  LeadStatus,
  LeadSource,
  LeadQuality,
  PaymentMethod,
  MeasurementStatus,
  MeasurementUnit,
  StaffStatus,
  EmploymentType,
  SalaryType,
  ExpenseCategory,
  ErrorCode,
  Permission,
  AuditAction,
} from '@/shared/enums';
export {
  ORDER_STATUSES,
  ORDER_PRODUCTION_FLOW,
  ORDER_PRIORITIES,
  ORDER_STATUS_TRANSITIONS,
  LEAD_STATUSES,
  LEAD_SOURCES,
  PAYMENT_METHODS,
  USER_ROLES,
  ERROR_CODES,
  PERMISSIONS,
  PERMISSION_GROUPS,
  DEFAULT_STAFF_PERMISSIONS,
  AUDIT_ACTIONS,
} from '@/shared/enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Explicit capabilities for staff accounts. Admins implicitly hold all. */
  permissions?: Permission[];
  customerId?: string;
  referenceId?: string;
  status?: UserStatus;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
}

export interface AuthTokens {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

