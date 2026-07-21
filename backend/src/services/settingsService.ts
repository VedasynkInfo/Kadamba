import { WebsiteSettings, type IWebsiteSettings } from '../models/WebsiteSettings';
import { toDto } from '../utils/serialize';

const DEFAULT_SETTINGS = {
  key: 'site',
  studioName: "Kadamba's Designer Studio",
  location: 'Kurnool',
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  email: 'hello@kadambasstudio.com',
  addressLines: ['Near Main Road', 'Kurnool, Andhra Pradesh'],
  hours: [
    { day: 'Mon – Sat', time: '10:00 AM – 7:00 PM' },
    { day: 'Sunday', time: 'By appointment' },
  ],
  whatsappNumber: '919876543210',
  whatsappPrefill: "Hi Kadamba's Designer Studio — I'd like to enquire about bridal / traditional wear.",
  mapEmbedUrl: '',
  mapLink: 'https://maps.google.com/?q=Kurnool',
  social: [],
};

export type SettingsDto = Record<string, unknown> & { id?: string };

function serialize(doc: IWebsiteSettings | Record<string, unknown>): SettingsDto {
  const dto = toDto<SettingsDto>(doc);
  delete dto.key;
  return dto;
}

export async function getSettings(): Promise<SettingsDto> {
  let doc = await WebsiteSettings.findOne({ key: 'site' });
  if (!doc) {
    doc = await WebsiteSettings.create(DEFAULT_SETTINGS);
  }
  return serialize(doc);
}

export async function updateSettings(input: Record<string, unknown>): Promise<SettingsDto> {
  const allowed = [
    'studioName',
    'location',
    'phoneDisplay',
    'phoneTel',
    'email',
    'addressLines',
    'hours',
    'whatsappNumber',
    'whatsappPrefill',
    'mapEmbedUrl',
    'mapLink',
    'social',
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (input[key] !== undefined) update[key] = input[key];
  }

  const doc = await WebsiteSettings.findOneAndUpdate(
    { key: 'site' },
    {
      $set: update,
      $setOnInsert: { ...DEFAULT_SETTINGS, ...update, key: 'site' },
    },
    { upsert: true, new: true },
  );

  return serialize(doc!);
}
