import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(uri: string = env.mongodbUri): Promise<void> {
  const maxAttempts = env.isProduction ? 5 : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info({ attempt }, 'MongoDB connected');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: message, attempt, maxAttempts }, 'MongoDB connection error');
      if (env.isTest) throw error;
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  process.exit(1);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
