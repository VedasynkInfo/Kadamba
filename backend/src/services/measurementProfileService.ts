import { MeasurementProfile, IMeasurementProfile, IMeasurementVersion } from '../models/MeasurementProfile';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { Customer } from '../models/Customer';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { searchRegex } from '../utils/query';

export type MeasurementProfileDto = {
  id: string;
  customerName?: string;
  productTypeName?: string;
  customerId: string;
  productTypeCode: string;
  profileName: string;
  unit: string;
  status: string;
  measurements: Record<string, number>;
  versions: unknown[];
  notes: string;
  referenceImages: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

function serialize(doc: IMeasurementProfile | Record<string, unknown>, customerName?: string): MeasurementProfileDto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dto = toDto<MeasurementProfileDto>(doc as any);
  return {
    ...dto,
    customerName: customerName || dto.customerName,
    productTypeName: typeof doc === 'object' && 'productTypeCode' in doc
      ? (doc as any).productTypeCode as string
      : undefined,
  };
}

async function profileExists(id: string): Promise<boolean> {
  return Boolean(await MeasurementProfile.exists({ _id: id }));
}

async function findByIdOrThrow(id: string) {
  const doc = await MeasurementProfile.findById(id);
  if (!doc) throw new ApiError(404, 'Measurement profile not found');
  return doc;
}

export async function listProfiles(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};

  if (typeof query.status === 'string' && query.status) {
    filter.status = query.status;
  }

  if (typeof query.customerId === 'string' && query.customerId) {
    filter.customerId = query.customerId;
  }

  if (typeof query.productTypeCode === 'string' && query.productTypeCode) {
    filter.productTypeCode = query.productTypeCode;
  }

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [
      { profileName: { $regex: q, $options: 'i' } },
      { 'values.*': { $regex: q, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'oldest' ? { createdAt: 1 } : { updatedAt: -1 };

  const [docs, total] = await Promise.all([
    MeasurementProfile.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    MeasurementProfile.countDocuments(filter),
  ]);

  const customerIds = [
    ...new Set(
      docs
        .map((d) => String(d.customerId))
        .filter((id) => /^[a-f\d]{24}$/i.test(id)),
    ),
  ];
  const customers = customerIds.length
    ? await Customer.find({ _id: { $in: customerIds } }).select('name').lean()
    : [];
  const nameMap = new Map(customers.map((c) => [String(c._id), c.name]));

  return {
    items: docs.map((d) => serialize(d, nameMap.get(String(d.customerId)))),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getProfile(id: string) {
  const doc = await findByIdOrThrow(id);
  return serialize(doc);
}

export async function createProfile(input: Record<string, unknown>, actor: string) {
  const existingTemplate = await MeasurementTemplate.findOne({
    code: input.productTypeCode as string,
    active: true,
  });

  const doc = await MeasurementProfile.create({
    ...input,
    measuredBy: actor,
    measuredAt: new Date(),
  });

  return serialize(doc.toJSON());
}

export async function updateProfile(id: string, input: Record<string, unknown>, actor: string) {
  const existing = await findByIdOrThrow(id);

  if (input.productTypeCode && input.productTypeCode !== existing.productTypeCode) {
    const template = await MeasurementTemplate.findOne({ code: input.productTypeCode, active: true });
    if (!template) {
      throw new ApiError(404, 'Measurement template not found or inactive');
    }
    (existing as unknown as Record<string, unknown>).productTypeCode = input.productTypeCode;
  }

  const skip = new Set(['id', '_id', 'customerId', 'productTypeCode', 'createdAt', 'updatedAt']);
  const valuesChanged = input.values && JSON.stringify(input.values) !== JSON.stringify(existing.values);
  
  for (const [key, value] of Object.entries(input)) {
    if (skip.has(key) || value === undefined) continue;
    (existing as unknown as Record<string, unknown>)[key] = value;
  }

  // Handle versioning manually
  if (valuesChanged) {
    existing.currentVersion += 1;
    existing.versions.push({
      values: existing.values,
      notes: existing.notes,
      changedBy: actor,
      changedAt: new Date(),
      reason: 'Updated measurements',
      referenceImages: existing.referenceImages,
    } as IMeasurementVersion);
  }

  const updated = await existing.save();
  return serialize(updated.toJSON());
}

export async function archiveProfile(id: string, archive: boolean) {
  const existing = await findByIdOrThrow(id);

  existing.status = archive ? 'archived' : 'active';
  await existing.save();

  return serialize(existing.toJSON());
}

export async function duplicateProfile(id: string, actor: string) {
  const existing = await findByIdOrThrow(id);

  const duplicate = await MeasurementProfile.create({
    customerId: existing.customerId,
    productTypeCode: existing.productTypeCode,
    profileName: `${existing.profileName} (Copy)`,
    unit: existing.unit,
    status: 'draft',
    values: { ...existing.values },
    notes: existing.notes,
    orderId: existing.orderId,
    measuredBy: actor,
    measuredAt: new Date(),
    referenceImages: existing.referenceImages,
    currentVersion: 1,
    versions: [],
  });

  return serialize(duplicate.toJSON());
}

export async function getProfileHistory(id: string) {
  const existing = await findByIdOrThrow(id);
  return {
    profile: serialize(existing),
    versions: existing.versions.map((v) => {
      const r = v as unknown as Record<string, unknown>;
      return { ...r, id: String(r._id || '') };
    }),
  };
}

export async function seedProfiles() {
  const count = await MeasurementProfile.countDocuments();
  if (count > 0) {
    return { message: 'Profiles already seeded', count };
  }

  return { message: 'Profiles not seeded — requires customer data', count: 0 };
}