import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

/**
 * Cloudinary client configuration.
 *
 * NOTE: storage/upload middleware lives in `routes/uploadRoutes.ts` so the
 * storage backend can be selected at runtime (local disk by default). This
 * module intentionally exports only the configured client.
 */
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export { cloudinary };
