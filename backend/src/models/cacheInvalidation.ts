import mongoose from 'mongoose';
import { CACHE_KEYS, invalidateCache } from '../services/cacheService';

/**
 * Cache invalidation, applied to every model as a Mongoose plugin.
 *
 * A plugin runs when the schema is compiled into a model, which is the only
 * point at which Mongoose still honours `post` middleware — registering hooks
 * after the model exists is silently ignored in Mongoose 9.
 *
 * The point of doing it this way is coverage: "the cache is invalidated on
 * write" becomes a property of the data layer, not a rule each service has to
 * remember. A new endpoint that saves a lead cannot quietly serve a stale
 * dashboard.
 *
 * Each model is mapped to the cache namespace it feeds. Models that feed no
 * cached read are simply not listed.
 */
const MODEL_CACHE_PREFIX: Record<string, string> = {
  Lead: CACHE_KEYS.dashboard,
  Order: CACHE_KEYS.dashboard,
  Payment: CACHE_KEYS.dashboard,
  MeasurementProfile: CACHE_KEYS.dashboard,
  Blog: CACHE_KEYS.cmsBlog,
  Portfolio: CACHE_KEYS.cmsPortfolio,
  Service: CACHE_KEYS.cmsService,
  GalleryItem: CACHE_KEYS.cmsGallery,
  ProductType: CACHE_KEYS.cmsCatalog,
  ProductCategory: CACHE_KEYS.cmsCatalog,
};

/** Document middleware runs with the document as `this`. */
function documentModelName(context: unknown): string | undefined {
  const doc = context as { constructor?: { modelName?: string } } | undefined;
  return doc?.constructor?.modelName;
}

/** Query middleware runs with the query as `this`. */
function queryModelName(context: unknown): string | undefined {
  const query = context as { model?: { modelName?: string } } | undefined;
  return query?.model?.modelName;
}

function invalidateFor(context: unknown, resolveModelName: (c: unknown) => string | undefined) {
  const modelName = resolveModelName(context);
  if (!modelName) return;
  const prefix = MODEL_CACHE_PREFIX[modelName];
  if (!prefix) return;
  invalidateCache(prefix);
}

/** The plugin itself. */
export function cacheInvalidationPlugin(schema: mongoose.Schema): void {
  // Document middleware: save, and the document-level delete.
  schema.post('save', function (this: unknown) {
    invalidateFor(this, documentModelName);
  });
  schema.post('deleteOne', function (this: unknown) {
    invalidateFor(this, documentModelName);
  });

  // Query middleware: every bulk write path.
  const queryEvents = [
    'findOneAndUpdate',
    'findOneAndDelete',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'replaceOne',
  ] as const;

  for (const event of queryEvents) {
    schema.post(event, function (this: unknown) {
      invalidateFor(this, queryModelName);
    });
  }

  // `bulkWrite` and `insertMany` have their own overloads in the Mongoose
  // types, so they are registered separately.
  schema.post('bulkWrite', function (this: unknown) {
    invalidateFor(this, queryModelName);
  });
  schema.post('insertMany', function (this: unknown) {
    invalidateFor(this, queryModelName);
  });
}

let registered = false;

/**
 * Install the plugin globally.
 *
 * Must run before any model is compiled, so `config/database.ts` calls it at
 * connection time and the model modules import it for the compile-time path.
 */
export function registerCacheInvalidation(): void {
  if (registered) return;
  registered = true;
  mongoose.plugin(cacheInvalidationPlugin);
}

/** Test helper — allow re-registration. */
export function resetCacheInvalidationRegistration(): void {
  registered = false;
}

// Registering on import is deliberate: the plugin has to be in place before
// `mongoose.model()` compiles a schema, and that happens at module load. Every
// model that feeds a cache imports this file first.
registerCacheInvalidation();
