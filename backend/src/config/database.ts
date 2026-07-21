import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(uri: string = env.mongodbUri): Promise<void> {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: message }, 'MongoDB connection error');
    // In tests we surface the error to the runner instead of killing the process.
    if (env.isTest) throw error;
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
