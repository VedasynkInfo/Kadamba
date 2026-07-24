import type { Document } from 'mongoose';

/**
 * Convert a Mongoose document (or lean object) into a plain DTO with `id`.
 */
export function toDto<T>(
  doc: Document | Record<string, unknown>,
): T {
  const raw =
    typeof (doc as Document).toObject === 'function'
      ? (doc as Document).toObject({ virtuals: false })
      : { ...doc };

  const { _id, __v: _version, ...rest } = raw as Record<string, unknown> & {
    _id?: { toString(): string } | string;
    __v?: number;
  };
  void _version;

  const id =
    _id == null
      ? undefined
      : typeof _id === 'string'
        ? _id
        : String(_id);

  return { id, ...serializeDates(rest) } as unknown as T;
}

function serializeDates(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) => {
        if (item instanceof Date) return item.toISOString();
        if (item && typeof item === 'object') {
          if (item.constructor?.name === 'ObjectId' || typeof (item as { toHexString?: () => string }).toHexString === 'function') {
            return item.toString();
          }
          return serializeNested(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      if (value.constructor?.name === 'ObjectId' || typeof (value as { toHexString?: () => string }).toHexString === 'function') {
        out[key] = value.toString();
      } else {
        out[key] = serializeNested(value as Record<string, unknown>);
      }
    } else {
      out[key] = value;
    }
  }
  return out;
}

function serializeNested(obj: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v: _version, ...rest } = obj as Record<string, unknown> & {
    _id?: { toString(): string } | string;
  };
  void _version;
  const base = serializeDates(rest);
  if (_id != null) {
    base.id = typeof _id === 'string' ? _id : String(_id);
  }
  return base;
}
