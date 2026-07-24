import { Staff, IStaff, EmploymentType, SalaryType, StaffStatus } from '../models/Staff';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

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
  createdAt: string;
  updatedAt: string;
}

export async function createStaff(input: CreateStaffInput): Promise<StaffDto> {
  const existing = await Staff.findOne({ phone: input.phone });
  if (existing) {
    throw new ApiError(400, `A staff member with phone number ${input.phone} already exists`);
  }

  const staff = new Staff({
    ...input,
    joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
  });

  await staff.save();
  return toDto<StaffDto>(staff);
}

export async function getStaffById(id: string): Promise<StaffDto> {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }
  return toDto<StaffDto>(staff);
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
    const regex = new RegExp(String(query.q).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: regex }, { phone: regex }, { locality: regex }];
  }

  const [items, total] = await Promise.all([
    Staff.find(filter)
      .sort({ fullName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Staff.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => toDto<StaffDto>(doc)),
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
