import mongoose from 'mongoose';
import { MeasurementTemplate, IMeasurementTemplate, IMeasurementFieldDef } from '../models/MeasurementTemplate';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { searchRegex, parseBooleanQuery } from '../utils/query';

export type MeasurementTemplateDto = IMeasurementTemplate & { id: string };

function serialize(doc: IMeasurementTemplate | Record<string, unknown>): MeasurementTemplateDto {
  return toDto<MeasurementTemplateDto>(doc);
}

async function templateExists(code: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { code };
  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    filter._id = { $ne: excludeId };
  }
  return Boolean(await MeasurementTemplate.exists(filter));
}

export async function listTemplates(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};

  const active = parseBooleanQuery(query.active);
  if (active !== undefined) filter.active = active;

  if (typeof query.category === 'string' && query.category) filter.category = query.category;

  const q = searchRegex(typeof query.q === 'string' ? query.q : undefined);
  if (q) {
    filter.$or = [
      { code: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'oldest' ? { createdAt: 1 } : { version: -1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    MeasurementTemplate.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    MeasurementTemplate.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serialize(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getTemplate(code: string) {
  const doc = await MeasurementTemplate.findOne({ code }).lean();
  if (!doc) throw new ApiError(404, 'Measurement template not found');
  return serialize(doc);
}

export async function createTemplate(
  input: Record<string, unknown> & { code: string; fieldDefs: IMeasurementFieldDef[] },
  actor: string,
) {
  if (await templateExists(input.code)) {
    throw new ApiError(409, 'Measurement template with this code already exists');
  }
  const doc = await MeasurementTemplate.create({ ...input, createdBy: actor, version: 1 });
  return serialize(doc.toJSON());
}

export async function updateTemplate(code: string, input: Record<string, unknown>, actor: string) {
  const existing = await MeasurementTemplate.findOne({ code });
  if (!existing) throw new ApiError(404, 'Measurement template not found');

  if (input.code && input.code !== code) {
    if (await templateExists(input.code, existing._id.toString())) {
      throw new ApiError(409, 'Measurement template with this code already exists');
    }
    (existing as unknown as Record<string, unknown>).code = input.code;
  }

  const skip = new Set(['id', '_id', 'code', 'createdAt', 'updatedAt', 'version']);
  for (const [key, value] of Object.entries(input)) {
    if (skip.has(key) || value === undefined) continue;
    (existing as unknown as Record<string, unknown>)[key] = value;
  }
  existing.version += 1;
  const updated = await existing.save();
  return serialize(updated.toJSON());
}

export async function archiveTemplate(code: string, active: boolean) {
  const existing = await MeasurementTemplate.findOne({ code });
  if (!existing) throw new ApiError(404, 'Measurement template not found');
  existing.active = active;
  existing.version += 1;
  await existing.save();
  return serialize(existing.toJSON());
}

// ── Field helpers ──────────────────────────────────────────────
function f(
  key: string,
  label: string,
  type: 'number' | 'text' | 'enum' | 'boolean',
  overrides: Partial<IMeasurementFieldDef> = {},
): IMeasurementFieldDef {
  return {
    key,
    label,
    type,
    unit: type === 'number' ? 'in' : undefined,
    required: false,
    group: 'General',
    sortOrder: 0,
    ...overrides,
  };
}

// ── Group A — Upper Body ───────────────────────────────────────
function groupA(offset = 0): IMeasurementFieldDef[] {
  const fields: IMeasurementFieldDef[] = [
    f('bust', 'Bust', 'number', { required: true, min: 0, max: 100, group: 'Upper Body', sortOrder: 1 + offset }),
    f('under_bust', 'Under Bust', 'number', { min: 0, max: 100, group: 'Upper Body', sortOrder: 2 + offset }),
    f('waist_upper', 'Waist', 'number', { required: true, min: 0, max: 100, group: 'Upper Body', sortOrder: 3 + offset }),
    f('shoulder', 'Shoulder', 'number', { required: true, min: 0, max: 30, group: 'Upper Body', sortOrder: 4 + offset }),
    f('shoulder_to_bust', 'Shoulder to Bust Point', 'number', { min: 0, max: 30, group: 'Upper Body', sortOrder: 5 + offset }),
    f('front_length', 'Front Length', 'number', { required: true, min: 0, max: 50, group: 'Upper Body', sortOrder: 6 + offset }),
    f('back_length', 'Back Length', 'number', { min: 0, max: 50, group: 'Upper Body', sortOrder: 7 + offset }),
    f('sleeve_length', 'Sleeve Length', 'number', { min: 0, max: 30, group: 'Upper Body', sortOrder: 8 + offset }),
    f('armhole', 'Armhole', 'number', { required: true, min: 0, max: 30, group: 'Upper Body', sortOrder: 9 + offset }),
    f('bicep', 'Upper Arm / Bicep', 'number', { min: 0, max: 30, group: 'Upper Body', sortOrder: 10 + offset }),
    f('elbow', 'Elbow', 'number', { min: 0, max: 30, group: 'Upper Body', sortOrder: 11 + offset }),
    f('wrist', 'Wrist / Sleeve Opening', 'number', { min: 0, max: 20, group: 'Upper Body', sortOrder: 12 + offset }),
    f('neck_depth_front', 'Front Neck Depth', 'number', { required: true, min: 0, max: 15, group: 'Upper Body', sortOrder: 13 + offset }),
    f('neck_depth_back', 'Back Neck Depth', 'number', { required: true, min: 0, max: 15, group: 'Upper Body', sortOrder: 14 + offset }),
    f('neck_width', 'Neck Width', 'number', { min: 0, max: 10, group: 'Upper Body', sortOrder: 15 + offset }),
    f('cross_front', 'Cross Front', 'number', { min: 0, max: 20, group: 'Upper Body', sortOrder: 16 + offset }),
    f('cross_back', 'Cross Back', 'number', { min: 0, max: 20, group: 'Upper Body', sortOrder: 17 + offset }),
    f('apex', 'Apex (Bust Point Gap)', 'number', { min: 0, max: 15, group: 'Upper Body', sortOrder: 18 + offset }),
    f('cup_size', 'Cup Size', 'text', { group: 'Upper Body', sortOrder: 19 + offset }),
    f('padding', 'Padding', 'enum', { options: ['none', 'light', 'heavy'], group: 'Upper Body', sortOrder: 20 + offset }),
    f('blouse_hooks', 'Hook Count / Closing', 'text', { group: 'Upper Body', sortOrder: 21 + offset }),
  ];
  return fields;
}

// ── Group B — Lower Body ───────────────────────────────────────
function groupB(offset = 0): IMeasurementFieldDef[] {
  return [
    f('waist_lower', 'Waist', 'number', { required: true, min: 0, max: 100, group: 'Lower Body', sortOrder: 1 + offset }),
    f('hip', 'Hip', 'number', { required: true, min: 0, max: 100, group: 'Lower Body', sortOrder: 2 + offset }),
    f('seat', 'Seat', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 3 + offset }),
    f('skirt_length', 'Skirt / Lehenga Length', 'number', { required: true, min: 0, max: 200, group: 'Lower Body', sortOrder: 4 + offset }),
    f('flare', 'Flare / Bottom Circumference', 'number', { min: 0, max: 50, group: 'Lower Body', sortOrder: 5 + offset }),
    f('thigh', 'Thigh', 'number', { min: 0, max: 40, group: 'Lower Body', sortOrder: 6 + offset }),
    f('crotch', 'Crotch Depth', 'number', { min: 0, max: 20, group: 'Lower Body', sortOrder: 7 + offset }),
    f('knee', 'Knee', 'number', { min: 0, max: 30, group: 'Lower Body', sortOrder: 8 + offset }),
    f('ankle', 'Ankle / Bottom Opening', 'number', { min: 0, max: 20, group: 'Lower Body', sortOrder: 9 + offset }),
    f('inseam', 'Inseam', 'number', { min: 0, max: 50, group: 'Lower Body', sortOrder: 10 + offset }),
    f('outseam', 'Outseam', 'number', { min: 0, max: 50, group: 'Lower Body', sortOrder: 11 + offset }),
    f('can_can', 'Can-Can / Net Layers', 'enum', { options: ['yes', 'no', 'yes + layers'], group: 'Lower Body', sortOrder: 12 + offset }),
    f('waistband_style', 'Waistband Style', 'enum', { options: ['elastic', 'drawstring', 'fitted', 'belt'], group: 'Lower Body', sortOrder: 13 + offset }),
    f('lining', 'Lining', 'enum', { options: ['full', 'partial', 'none'], group: 'Lower Body', sortOrder: 14 + offset }),
  ];
}

// ── Group C — Full Length / Gown ───────────────────────────────
function groupC(offset = 0): IMeasurementFieldDef[] {
  return [
    f('full_length', 'Full Length (shoulder to floor)', 'number', { required: true, min: 0, max: 200, group: 'Full Length / Gown', sortOrder: 1 + offset }),
    f('train_length', 'Train Length', 'number', { min: 0, max: 100, group: 'Full Length / Gown', sortOrder: 2 + offset }),
    f('slit_length', 'Slit Length', 'number', { min: 0, max: 60, group: 'Full Length / Gown', sortOrder: 3 + offset }),
  ];
}

// ── Group D — Salwar / Bottom Set Extra ────────────────────────
function groupD(offset = 0): IMeasurementFieldDef[] {
  return [
    f('salwar_length', 'Salwar / Pant Length', 'number', { required: true, min: 0, max: 50, group: 'Bottom Set', sortOrder: 1 + offset }),
    f('bottom_style', 'Bottom Style', 'text', { group: 'Bottom Set', sortOrder: 2 + offset }),
    f('dupatta_length', 'Dupatta Length', 'number', { min: 0, max: 120, group: 'Bottom Set', sortOrder: 3 + offset }),
    f('dupatta_width', 'Dupatta Width', 'number', { min: 0, max: 60, group: 'Bottom Set', sortOrder: 4 + offset }),
  ];
}

// ── Group E — Kids Adjustments ─────────────────────────────────
function groupE(offset = 0): IMeasurementFieldDef[] {
  return [
    f('age_approx', 'Approx Age', 'number', { min: 0, max: 16, group: 'Kids Adjustments', sortOrder: 1 + offset }),
    f('growth_ease', 'Extra Ease for Growth', 'number', { min: 0, max: 5, group: 'Kids Adjustments', sortOrder: 2 + offset }),
  ];
}

// ── Group F — Work / Style Preferences ─────────────────────────
function groupF(offset = 0): IMeasurementFieldDef[] {
  return [
    f('fabric_provided', 'Fabric Provided By', 'enum', { options: ['customer', 'boutique', 'both'], group: 'Work / Style', sortOrder: 1 + offset }),
    f('fabric_notes', 'Fabric Notes', 'text', { group: 'Work / Style', sortOrder: 2 + offset }),
    f('embroidery_type', 'Embroidery Type', 'enum', { options: ['maggam', 'zardosi', 'aari', 'machine', 'none', 'mixed'], group: 'Work / Style', sortOrder: 3 + offset }),
    f('embroidery_notes', 'Embroidery / Motif Notes', 'text', { group: 'Work / Style', sortOrder: 4 + offset }),
    f('lining_fabric', 'Lining Fabric', 'text', { group: 'Work / Style', sortOrder: 5 + offset }),
    f('trial_required', 'Trial Required', 'boolean', { group: 'Work / Style', sortOrder: 6 + offset }),
    f('delivery_notes', 'Delivery / Occasion Date Notes', 'text', { group: 'Work / Style', sortOrder: 7 + offset }),
    f('special_instructions', 'Special Instructions', 'text', { group: 'Work / Style', sortOrder: 8 + offset }),
  ];
}

// ── Full ladies catalog from PRD ───────────────────────────────
export interface SeedTemplate {
  code: string;
  name: string;
  category: string;
  description: string;
  fieldDefs: any[]; // Use any[] or specific field defs
}

export function seedData(): SeedTemplate[] {
  return [
    // ═══ Bridal Collection ═══
    { code: 'BR-LH', name: 'Bridal Lehenga', category: 'Bridal Collection', description: 'Complete bridal lehenga with dupatta', fieldDefs: [...groupB(), ...groupF(20)] },
    { code: 'BR-BL', name: 'Bridal Blouse', category: 'Bridal Collection', description: 'Bridal blouse for lehenga or saree', fieldDefs: [...groupA(), ...groupF(25)] },
    { code: 'BR-SR', name: 'Bridal Saree Stitching / Fall Pico', category: 'Bridal Collection', description: 'Saree finishing service — fall, pico, edge work', fieldDefs: [f('saree_length', 'Saree Length', 'number', { required: true, min: 0, max: 600, group: 'Saree', sortOrder: 1 }), f('fall_pico', 'Fall / Pico Type', 'text', { required: true, group: 'Saree', sortOrder: 2 }), f('blouse_stitching', 'Blouse Stitching Required', 'boolean', { group: 'Saree', sortOrder: 3 }), ...groupF(10)] },
    { code: 'BR-RG', name: 'Reception Gown', category: 'Bridal Collection', description: 'Reception evening gown with train', fieldDefs: [...groupA(), ...groupC(25), f('hip', 'Hip', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 28 }), f('waist_lower', 'Waist', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 29 }), ...groupF(35)] },
    { code: 'BR-WG', name: 'Wedding Gown', category: 'Bridal Collection', description: 'White/ivory wedding gown', fieldDefs: [...groupA(), ...groupC(25), f('hip', 'Hip', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 28 }), f('waist_lower', 'Waist', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 29 }), ...groupF(35)] },
    { code: 'BR-HS', name: 'Half Saree / Langa Voni', category: 'Bridal Collection', description: 'Traditional half saree for ceremonies', fieldDefs: [...groupB(), ...groupA(20), ...groupF(45)] },
    { code: 'BR-DP', name: 'Designer Dupatta', category: 'Bridal Collection', description: 'Length/width + work notes for bridal dupatta', fieldDefs: [f('dupatta_length', 'Dupatta Length', 'number', { required: true, min: 0, max: 120, group: 'Dupatta', sortOrder: 1 }), f('dupatta_width', 'Dupatta Width', 'number', { required: true, min: 0, max: 60, group: 'Dupatta', sortOrder: 2 }), f('embroidery_type', 'Embroidery Type', 'enum', { options: ['maggam', 'zardosi', 'aari', 'machine', 'none', 'mixed'], group: 'Work / Style', sortOrder: 3 }), f('special_instructions', 'Work Notes', 'text', { group: 'Work / Style', sortOrder: 4 })] },

    // ═══ Ethnic / Designer Blouses ═══
    { code: 'BL-SR', name: 'Saree Blouse', category: 'Ethnic / Designer Blouses', description: 'Classic saree blouse', fieldDefs: [...groupA()] },
    { code: 'BL-DS', name: 'Designer Blouse', category: 'Ethnic / Designer Blouses', description: 'Designer blouse with custom patterns', fieldDefs: [...groupA(), ...groupF(25)] },
    { code: 'BL-MG', name: 'Maggam Blouse', category: 'Ethnic / Designer Blouses', description: 'Maggam work blouse with intricate hand embroidery', fieldDefs: [...groupA(), ...groupF(25)] },
    { code: 'BL-PT', name: 'Pattu Blouse', category: 'Ethnic / Designer Blouses', description: 'Silk pattu blouse for festival wear', fieldDefs: [...groupA()] },
    { code: 'BL-CT', name: 'Cotton Blouse', category: 'Ethnic / Designer Blouses', description: 'Daily wear cotton blouse', fieldDefs: [...groupA()] },
    { code: 'BL-PC', name: 'Princess Cut Blouse', category: 'Ethnic / Designer Blouses', description: 'Princess cut blouse with darts', fieldDefs: [...groupA()] },
    { code: 'BL-HN', name: 'High Neck Blouse', category: 'Ethnic / Designer Blouses', description: 'High neck / closed neck blouse', fieldDefs: [...groupA()] },
    { code: 'BL-BN', name: 'Boat Neck Blouse', category: 'Ethnic / Designer Blouses', description: 'Boat neck / wide neck blouse', fieldDefs: [...groupA()] },
    { code: 'BL-CL', name: 'Collar Blouse', category: 'Ethnic / Designer Blouses', description: 'Collar neck blouse with structure', fieldDefs: [...groupA()] },
    { code: 'BL-BK', name: 'Backless / Deep Back Blouse', category: 'Ethnic / Designer Blouses', description: 'Backless or deep back cut blouse', fieldDefs: [...groupA()] },
    { code: 'BL-KP', name: 'Katori / Cup Blouse', category: 'Ethnic / Designer Blouses', description: 'Katori (cup) structured blouse', fieldDefs: [...groupA()] },
    { code: 'BL-PK', name: 'Peplum Blouse', category: 'Ethnic / Designer Blouses', description: 'Peplum style blouse with flare bottom', fieldDefs: [...groupA()] },

    // ═══ Kurtis & Tunics ═══
    { code: 'KT-ST', name: 'Straight Kurti', category: 'Kurtis & Tunics', description: 'Simple straight cut kurti', fieldDefs: [...groupA()] },
    { code: 'KT-AN', name: 'Anarkali', category: 'Kurtis & Tunics', description: 'Floor-length Anarkali with flare', fieldDefs: [...groupA(), ...groupC(25), f('flare', 'Flare Notes', 'text', { group: 'Flare', sortOrder: 28 }), ...groupF(30)] },
    { code: 'KT-AL', name: 'A-Line Kurti', category: 'Kurtis & Tunics', description: 'A-line kurti with slight flare', fieldDefs: [...groupA()] },
    { code: 'KT-UM', name: 'Umbrella Kurti', category: 'Kurtis & Tunics', description: 'Umbrella / circular kurti', fieldDefs: [...groupA()] },
    { code: 'KT-JK', name: 'Jacket Kurti', category: 'Kurtis & Tunics', description: 'Layered jacket style kurti', fieldDefs: [...groupA()] },
    { code: 'KT-LN', name: 'Long Kurti / Kurta Set', category: 'Kurtis & Tunics', description: 'Long kurti with bottom set', fieldDefs: [...groupA()] },

    // ═══ Dresses & Gowns ═══
    { code: 'DR-LG', name: 'Long Gown', category: 'Dresses & Gowns', description: 'Floor-length evening/party gown', fieldDefs: [...groupA(), ...groupC(25), f('hip', 'Hip', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 28 }), f('waist_lower', 'Waist', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 29 })] },
    { code: 'DR-PG', name: 'Party Gown', category: 'Dresses & Gowns', description: 'Party/evening gown with embellishments', fieldDefs: [...groupA(), ...groupC(25), f('hip', 'Hip', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 28 }), f('waist_lower', 'Waist', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 29 }), ...groupF(35)] },
    { code: 'DR-MX', name: 'Maxi Dress', category: 'Dresses & Gowns', description: 'Casual maxi dress', fieldDefs: [...groupA(), f('full_length', 'Full Length', 'number', { required: true, min: 0, max: 200, group: 'Length', sortOrder: 25 }), f('hip', 'Hip', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 26 }), f('waist_lower', 'Waist', 'number', { min: 0, max: 100, group: 'Lower Body', sortOrder: 27 })] },
    { code: 'DR-IW', name: 'Indo-Western Dress', category: 'Dresses & Gowns', description: 'Indo-western fusion dress', fieldDefs: [...groupA(), f('full_length', 'Full Length', 'number', { required: true, min: 0, max: 200, group: 'Length', sortOrder: 25 }), ...groupF(30)] },
    { code: 'DR-EV', name: 'Evening Dress', category: 'Dresses & Gowns', description: 'Short/medium evening dress', fieldDefs: [...groupA(), f('skirt_length', 'Dress Length', 'number', { required: true, min: 0, max: 60, group: 'Length', sortOrder: 25 })] },
    { code: 'DR-SH', name: 'Short Party Dress', category: 'Dresses & Gowns', description: 'Short party/cocktail dress', fieldDefs: [...groupA(), f('skirt_length', 'Dress Length', 'number', { required: true, min: 0, max: 40, group: 'Length', sortOrder: 25 })] },

    // ═══ Salwar / Suit Collection ═══
    { code: 'SL-CH', name: 'Churidar Suit', category: 'Salwar / Suit Collection', description: 'Churidar suit with kameez', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-PJ', name: 'Punjabi Suit', category: 'Salwar / Suit Collection', description: 'Punjabi suit with salwar', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-PT', name: 'Patiala', category: 'Salwar / Suit Collection', description: 'Patiala suit with pleated salwar', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-PL', name: 'Palazzo Set', category: 'Salwar / Suit Collection', description: 'Palazzo pants with kameez', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-SH', name: 'Sharara', category: 'Salwar / Suit Collection', description: 'Sharara suit with floor-length pants', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-GH', name: 'Gharara', category: 'Salwar / Suit Collection', description: 'Gharara suit with flared pants', fieldDefs: [...groupA(), ...groupD(25)] },
    { code: 'SL-DR', name: 'Dhoti Pants Set', category: 'Salwar / Suit Collection', description: 'Dhoti style pants with kameez', fieldDefs: [...groupA(), ...groupD(25)] },

    // ═══ Skirts & Bottoms ═══
    { code: 'SK-LH', name: 'Lehenga Skirt (non-bridal)', category: 'Skirts & Bottoms', description: 'Festive/non-bridal lehenga skirt', fieldDefs: [...groupB()] },
    { code: 'SK-PL', name: 'Palazzo', category: 'Skirts & Bottoms', description: 'Standalone palazzo pants', fieldDefs: [...groupB()] },
    { code: 'SK-SR', name: 'Sharara Skirt', category: 'Skirts & Bottoms', description: 'Sharara style skirt', fieldDefs: [...groupB()] },
    { code: 'SK-PN', name: 'Pant / Cigarette Pant', category: 'Skirts & Bottoms', description: 'Cigarette/straight pants', fieldDefs: [...groupB()] },
    { code: 'SK-HL', name: 'Half Saree Skirt', category: 'Skirts & Bottoms', description: 'Half saree skirt for ceremonies', fieldDefs: [...groupB()] },

    // ═══ Kids Wear (Girls) ═══
    { code: 'KD-LH', name: 'Kids Lehenga', category: 'Kids Wear (Girls)', description: 'Childrens lehenga for festive occasions', fieldDefs: [...groupB(), ...groupE(20)] },
    { code: 'KD-GW', name: 'Kids Gown', category: 'Kids Wear (Girls)', description: 'Childrens gown for parties', fieldDefs: [...groupA(), f('full_length', 'Full Length', 'number', { required: true, min: 0, max: 100, group: 'Length', sortOrder: 25 }), ...groupE(30)] },
    { code: 'KD-FR', name: 'Kids Frock', category: 'Kids Wear (Girls)', description: 'Childrens frock dress', fieldDefs: [...groupA(0), f('skirt_length', 'Skirt Length', 'number', { required: true, min: 0, max: 40, group: 'Length', sortOrder: 25 }), ...groupE(30)] },
    { code: 'KD-BL', name: 'Kids Blouse', category: 'Kids Wear (Girls)', description: 'Childrens blouse', fieldDefs: [...groupA(), ...groupE(25)] },
    { code: 'KD-AN', name: 'Kids Anarkali', category: 'Kids Wear (Girls)', description: 'Childrens Anarkali dress', fieldDefs: [...groupA(), ...groupE(25)] },

    // ═══ Custom Tailoring ═══
    { code: 'CU-DR', name: 'Custom Dress', category: 'Custom Tailoring', description: 'Custom-designed dress', fieldDefs: [...groupA(), ...groupB(25), ...groupF(45)] },
    { code: 'CU-BL', name: 'Custom Blouse', category: 'Custom Tailoring', description: 'Custom-designed blouse', fieldDefs: [...groupA(), ...groupF(25)] },
    { code: 'CU-SK', name: 'Custom Skirt', category: 'Custom Tailoring', description: 'Custom-designed skirt', fieldDefs: [...groupB(), ...groupF(20)] },
    { code: 'CU-OT', name: 'Custom Other', category: 'Custom Tailoring', description: 'Admin-defined custom garment — freeform fields', fieldDefs: [f('custom_notes', 'Custom Garment Notes', 'text', { required: true, group: 'Custom', sortOrder: 1 }), f('measurement_notes', 'Manual Measurement Notes', 'text', { required: true, group: 'Custom', sortOrder: 2 }), ...groupF(10)] },
  ];
}

export async function seedTemplates() {
  const count = await MeasurementTemplate.countDocuments();
  if (count > 0) {
    return { message: 'Templates already seeded', count };
  }

  const templates = seedData();
  await MeasurementTemplate.insertMany(templates.map((t) => ({ ...t, version: 1 })));
  return { message: 'Templates seeded', count: templates.length };
}