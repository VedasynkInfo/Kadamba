import fs from 'fs';
import path from 'path';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const blobStore = new Map<string, { data: Buffer; contentType?: string }>();

const mockFromConnectionString = vi.fn((_connStr: string) => ({
  getContainerClient: (containerName: string) => ({
    createIfNotExists: vi.fn(async () => ({ succeeded: true })),
    getBlockBlobClient: (blobName: string) => {
      const key = `${containerName}/${blobName}`;
      const url = `https://kadambatest.blob.core.windows.net/${containerName}/${blobName}`;
      return {
        url,
        uploadFile: vi.fn(async (absPath: string, opts?: { blobHTTPHeaders?: { blobContentType?: string } }) => {
          const data = fs.readFileSync(absPath);
          blobStore.set(key, { data, contentType: opts?.blobHTTPHeaders?.blobContentType });
        }),
        uploadData: vi.fn(async (data: Buffer, opts?: { blobHTTPHeaders?: { blobContentType?: string } }) => {
          blobStore.set(key, { data, contentType: opts?.blobHTTPHeaders?.blobContentType });
        }),
        exists: vi.fn(async () => blobStore.has(key)),
        downloadToFile: vi.fn(async (destPath: string) => {
          const entry = blobStore.get(key);
          if (!entry) throw new Error('BlobNotFound');
          fs.writeFileSync(destPath, entry.data);
        }),
        deleteIfExists: vi.fn(async () => {
          const existed = blobStore.delete(key);
          return { succeeded: existed };
        }),
      };
    },
    listBlobsFlat: ({ prefix }: { prefix: string }) => ({
      async *[Symbol.asyncIterator]() {
        const containerPrefix = `${containerName}/`;
        for (const key of [...blobStore.keys()]) {
          if (!key.startsWith(containerPrefix)) continue;
          const name = key.slice(containerPrefix.length);
          if (name.startsWith(prefix)) {
            yield { name };
          }
        }
      },
    }),
  }),
}));

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: (connStr: string) => mockFromConnectionString(connStr),
  },
}));

import { createApp } from '../app';
import { uploadsDir } from '../config/storage';
import { ImageAsset } from '../models/ImageAsset';
import {
  blobExists,
  deleteBlob,
  extractBlobNameFromUrl,
  isAzureBlobConfigured,
  isAzureBlobUrl,
  isAzureStorageActive,
  resetAzureBlobClientForTest,
  uploadBufferToBlob,
} from '../services/azureBlobService';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

async function sampleJpeg(width = 800, height = 600): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 160, g: 90, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

describe('Azure Blob Storage integration', () => {
  const savedEnv: Record<string, string | undefined> = {};
  const ENV_KEYS = [
    'UPLOAD_STORAGE',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_ACCOUNT',
    'AZURE_STORAGE_KEY',
    'AZURE_STORAGE_CONTAINER',
    'AZURE_STORAGE_PUBLIC_URL',
  ];

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    blobStore.clear();
    mockFromConnectionString.mockClear();
    resetAzureBlobClientForTest();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    resetAzureBlobClientForTest();
  });

  it('initializes from connection string or account + key', async () => {
    expect(isAzureBlobConfigured()).toBe(false);
    expect(isAzureStorageActive()).toBe(false);

    process.env.UPLOAD_STORAGE = 'azure';
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      'DefaultEndpointsProtocol=https;AccountName=kadambatest;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net';

    expect(isAzureBlobConfigured()).toBe(true);
    expect(isAzureStorageActive()).toBe(true);

    const url = await uploadBufferToBlob('uploads/test/hello.txt', Buffer.from('hello'), {
      contentType: 'text/plain',
    });
    expect(url).toBe('https://kadambatest.blob.core.windows.net/kadamba-media/uploads/test/hello.txt');
    expect(isAzureBlobUrl(url)).toBe(true);
    expect(extractBlobNameFromUrl(url)).toBe('uploads/test/hello.txt');
    expect(await blobExists(url)).toBe(true);

    expect(await deleteBlob(url)).toBe(true);
    expect(await blobExists(url)).toBe(false);

    // Now test Account Name + Key initialization path
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    process.env.AZURE_STORAGE_ACCOUNT = 'kadambatest';
    process.env.AZURE_STORAGE_KEY = 'dGVzdGtleQ==';
    resetAzureBlobClientForTest();

    expect(isAzureBlobConfigured()).toBe(true);
    expect(mockFromConnectionString).toHaveBeenLastCalledWith(
      'DefaultEndpointsProtocol=https;AccountName=kadambatest;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net',
    );
  });

  it('uploads originals & variants to Azure Blob, resolves them, and deletes cleanly', async () => {
    process.env.UPLOAD_STORAGE = 'azure';
    process.env.AZURE_STORAGE_ACCOUNT = 'kadambatest';
    process.env.AZURE_STORAGE_KEY = 'dGVzdGtleQ==';
    process.env.AZURE_STORAGE_CONTAINER = 'kadamba-media';

    const token = await registerAdminAndGetToken(app);
    const buffer = await sampleJpeg(900, 600);

    const uploadRes = await request(app)
      .post('/api/upload?folder=products')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', buffer, 'silk-saree.jpg');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.storage).toBe('azure');
    expect(uploadRes.body.data.url).toMatch(
      /^https:\/\/kadambatest\.blob\.core\.windows\.net\/kadamba-media\/uploads\/products\/.*silk-saree\.jpg$/,
    );

    const asset = uploadRes.body.data.asset as {
      id: string;
      hash: string;
      variants: Array<{ width: number; format: string; url: string }>;
    };
    expect(asset.variants.length).toBeGreaterThan(0);
    for (const v of asset.variants) {
      expect(v.url).toMatch(
        new RegExp(`^https://kadambatest\\.blob\\.core\\.windows\\.net/kadamba-media/uploads/optimized/${asset.hash}/`),
      );
    }

    // Local temporary file was cleaned up after uploading to Azure Blob
    const filename = path.basename(uploadRes.body.data.url as string);
    expect(fs.existsSync(path.join(uploadsDir, filename))).toBe(false);

    // Public resolver recognizes and resolves Azure Blob URLs
    const resolveRes = await request(app)
      .get('/api/media/resolve')
      .query({ urls: uploadRes.body.data.url });

    expect(resolveRes.status).toBe(200);
    const resolved = resolveRes.body.data.items[uploadRes.body.data.url as string];
    expect(resolved).toBeDefined();
    expect(resolved.variants.length).toBe(asset.variants.length);

    // Force-delete removes both variants and original from Azure Blob Storage
    const delRes = await request(app)
      .delete(`/api/admin/media/${asset.id}?force=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.removedFiles).toBe(asset.variants.length + 1);
    expect(blobStore.size).toBe(0);
    expect(await ImageAsset.findById(asset.id)).toBeNull();
  });
});
