import { Schema, model } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const Counter = model<ICounter>('Counter', counterSchema);

export async function getNextSequence(key: string, initialFallback?: number): Promise<number> {
  const incUpdate: Record<string, unknown> = { [String.fromCharCode(36) + 'inc']: { seq: 1 } };
  const counter = await Counter.findByIdAndUpdate(
    key,
    incUpdate,
    { new: true, upsert: true }
  );

  if (initialFallback !== undefined && counter.seq < initialFallback) {
    const setUpdate: Record<string, unknown> = { [String.fromCharCode(36) + 'set']: { seq: initialFallback } };
    const updated = await Counter.findByIdAndUpdate(
      key,
      setUpdate,
      { new: true }
    );
    return updated?.seq ?? initialFallback;
  }

  return counter.seq;
}
