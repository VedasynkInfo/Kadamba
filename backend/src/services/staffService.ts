import { Staff, EmploymentType, SalaryType, StaffStatus } from '../models/Staff';
import { User } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { DEFAULT_STAFF_PERMISSIONS } from '../shared/enums';
import type { Permission } from '../shared/enums';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { searchRegex } from '../utils/query';
import crypto from 'crypto';

export interface CreateStaffInput {
  fullName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  locality: string;
  address?: string;
  joiningDate?: string | Date;
  employmentType: EmploymentType;
  specializations: string[];
  yearsExperience?: number;
  previousWorkplaces?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  salaryType?: SalaryType;
  salaryAmount?: number;
  status?: StaffStatus;
  /** When true, also create a staff console login for this person. */
  createLogin?: boolean;
  /** Optional overrides; defaults to the least-privilege staff set. */
  permissions?: Permission[];
}

export interface UpdateStaffInput {
  fullName?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  locality?: string;
  address?: string;
  joiningDate?: string | Date;
  employmentType?: EmploymentType;
  specializations?: string[];
  yearsExperience?: number;
  previousWorkplaces?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  salaryType?: SalaryType;
  salaryAmount?: number;
  status?: StaffStatus;
}

export type StaffDto = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  locality: string;
  address?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  specializations: string[];
  yearsExperience?: number;
  previousWorkplaces?: string[];
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  salaryType: SalaryType;
  salaryAmount: number;
  status: StaffStatus;
  /** Linked console account, when one was provisioned. */
  userId?: string;
  loginEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Provision a console login for a staff member.
 *
 * No password is ever chosen by the admin: we mint a random unusable secret and
 * send a single-use setup link, so the admin never knows the staff password.
 * Permissions start at the least-privilege staff set and can be widened later
 * from the Users & Roles desk.
 */
export async function provisionStaffLogin(
  staffId: string,
  input: { email?: string; permissions?: Permission[] },
): Promise<{ userId: string; email: string; setupToken?: string; setupUrl: string }> {
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }
  if (staff.userId) {
    throw new ApiError(409, 'This staff member already has a console login');
  }

  const email = (input.email || staff.email || '').trim().toLowerCase();
  if (!email) {
    throw new ApiError(400, 'An email address is required to create a staff login');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // Random secret the user never sees; the reset link is the only way in.
  const placeholder = crypto.randomBytes(32).toString('base64url');

  const user = await User.create({
    name: staff.fullName,
    email,
    password: placeholder,
    role: 'staff',
    status: 'active',
    phone: staff.phone,
    permissions: input.permissions?.length ? input.permissions : [...DEFAULT_STAFF_PERMISSIONS],
  });

  staff.userId = user._id;
  if (!staff.email) staff.email = email;
  await staff.save();

  const rawToken = crypto.randomBytes(32).toString('base64url');
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000), // 7 days to accept the invite
  });

  const { env } = await import('../config/env');
  const setupUrl = `${env.frontendUrl}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;

  return {
    userId: String(user._id),
    email,
    // Only expose the raw token outside production (email delivery otherwise).
    setupToken: env.isProduction ? undefined : rawToken,
    setupUrl,
  };
}

export async function createStaff(input: CreateStaffInput): Promise<StaffDto> {
  const existing = await Staff.findOne({ phone: input.phone });
  if (existing) {
    throw new ApiError(400, `A staff member with phone number ${input.phone} already exists`);
  }

  const { createLogin, permissions, ...staffInput } = input;

  const staff = new Staff({
    ...staffInput,
    joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
  });

  await staff.save();

  if (createLogin) {
    try {
      await provisionStaffLogin(String(staff._id), {
        email: input.email,
        permissions,
      });
    } catch (error) {
      // Do not leave a half-created staff record behind.
      await Staff.deleteOne({ _id: staff._id });
      throw error;
    }
  }

  return getStaffById(String(staff._id));
}

export async function getStaffById(id: string): Promise<StaffDto> {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }
  return {
    ...toDto<StaffDto>(staff),
    userId: staff.userId ? String(staff.userId) : undefined,
    loginEmail: staff.email,
  };
}

export async function updateStaff(id: string, input: UpdateStaffInput): Promise<StaffDto> {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  if (input.phone && input.phone !== staff.phone) {
    const existing = await Staff.findOne({ phone: input.phone });
    if (existing) {
      throw new ApiError(400, `A staff member with phone number ${input.phone} already exists`);
    }
  }

  const updates = { ...input } as any;
  if (input.joiningDate) {
    updates.joiningDate = new Date(input.joiningDate);
  }

  Object.assign(staff, updates);
  await staff.save();
  return toDto<StaffDto>(staff);
}

export async function listStaff(query: Record<string, any>) {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, any> = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.employmentType) {
    filter.employmentType = query.employmentType;
  }
  if (query.specialization) {
    filter.specializations = { $in: [query.specialization] };
  }

  if (query.q) {
    const regex = searchRegex(String(query.q));
    if (regex) filter.$or = [{ fullName: regex }, { phone: regex }, { locality: regex }];
  }

  const [items, total] = await Promise.all([
    Staff.find(filter)
      .sort({ fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Staff.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => ({
      ...toDto<StaffDto>(doc),
      userId: doc.userId ? String(doc.userId) : undefined,
      loginEmail: doc.email,
    })),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function addPerformanceNote(id: string, body: string): Promise<StaffDto> {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  staff.performanceNotes.push({ body, at: new Date() });
  await staff.save();
  return toDto<StaffDto>(staff);
}
