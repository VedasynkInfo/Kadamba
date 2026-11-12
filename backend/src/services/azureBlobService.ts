import { BlobServiceClient, type ContainerClient } from '@azure/storage-blob';
import { env } from '../config/env';
import { logger } from '../config/logger';

let cachedClient: BlobServiceClient | null = null;
let cachedSignature = '';
const ensuredContainers = new Map<string, Promise<void>>();

function readAzureConfig() {
  const useEnvFallback = !env.isTest;
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() ||
    (useEnvFallback ? env.azureStorage.connectionString : '');
  const account =
    process.env.AZURE_STORAGE_ACCOUNT?.trim() ||
    (useEnvFallback ? env.azureStorage.account : '');
  const key =
    process.env.AZURE_STORAGE_KEY?.trim() ||
    (useEnvFallback ? env.azureStorage.key : '');
  const container =
    process.env.AZURE_STORAGE_CONTAINER?.trim() ||
    (useEnvFallback ? env.azureStorage.container : '') ||
    'kadamba-media';
  const publicUrl = (
    process.env.AZURE_STORAGE_PUBLIC_URL?.trim() ||
    (useEnvFallback ? env.azureStorage.publicUrl : '') ||
    ''
  ).replace(/\/$/, '');

  return { connectionString, account, key, container, publicUrl };
}

/** Reset cached client/container state (for tests). */
export function resetAzureBlobClientForTest(): void {
  cachedClient = null;
  cachedSignature = '';
  ensuredContainers.clear();
}

/** Lazily initialize the Azure `BlobServiceClient` from env configuration. */
export function getBlobServiceClient(): BlobServiceClient | null {
  const { connectionString, account, key } = readAzureConfig();
  const signature = `${connectionString}|${account}|${key}`;

  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  if (connectionString) {
    try {
      cachedClient = BlobServiceClient.fromConnectionString(connectionString);
      cachedSignature = signature;
      return cachedClient;
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Azure Blob client from connection string');
      cachedClient = null;
      cachedSignature = '';
      return null;
    }
  }

  if (account && key) {
    try {
      const builtConn = `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${key};EndpointSuffix=core.windows.net`;
      cachedClient = BlobServiceClient.fromConnectionString(builtConn);
      cachedSignature = signature;
      return cachedClient;
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Azure Blob client from account + key');
      cachedClient = null;
      cachedSignature = '';
      return null;
    }
  }

  return null;
}

/** True when Azure Blob credentials are available. */
export function isAzureBlobConfigured(): boolean {
  return getBlobServiceClient() !== null;
}

/** True when `UPLOAD_STORAGE` selects Azure (or auto-selected) and credentials are present. */
export function isAzureStorageActive(): boolean {
  const fallbackMode = env.isTest ? 'local' : env.uploadStorage;
  const mode = (process.env.UPLOAD_STORAGE?.trim() || fallbackMode).toLowerCase();
  if (mode === 'local') return false;
  if (mode === 'azure' || mode === 'blob') {
    return isAzureBlobConfigured();
  }
  return false;
}

export function getDefaultContainerName(): string {
  return readAzureConfig().container;
}

async function getContainerClient(containerName?: string): Promise<ContainerClient> {
  const client = getBlobServiceClient();
  if (!client) {
    throw new Error(
      'Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY.',
    );
  }

  const name = containerName || getDefaultContainerName();
  const containerClient = client.getContainerClient(name);

  let pending = ensuredContainers.get(name);
  if (!pending) {
    pending = containerClient
      .createIfNotExists({ access: 'blob' })
      .then(() => undefined)
      .catch((err: { statusCode?: number }) => {
        // If RBAC forbids container creation on a pre-provisioned container,
        // allow blob operations to proceed instead of failing the upload.
        if (err?.statusCode === 403 || err?.statusCode === 409) {
          logger.debug({ err, container: name }, 'Skipping Azure container createIfNotExists');
          return;
        }
        ensuredContainers.delete(name);
        throw err;
      });
    ensuredContainers.set(name, pending);
  }

  await pending;
  return containerClient;
}

function resolvePublicBlobUrl(blockBlobUrl: string, blobName: string): string {
  const { publicUrl } = readAzureConfig();
  if (!publicUrl) return blockBlobUrl;
  const encodedPath = blobName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${publicUrl}/${encodedPath}`;
}

/** True when `url` points at an Azure Blob Storage object or configured CDN origin. */
export function isAzureBlobUrl(url: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  const { publicUrl } = readAzureConfig();
  if (publicUrl && url.startsWith(`${publicUrl}/`)) return true;
  try {
    const parsed = new URL(url);
    return /\.blob\.core\./i.test(parsed.hostname);
  } catch {
    return false;
  }
}

/** Extract the container-relative blob name from a full blob URL or path. */
export function extractBlobNameFromUrl(
  urlOrName: string,
  containerName = getDefaultContainerName(),
): string | null {
  if (!urlOrName) return null;

  if (!/^https?:\/\//i.test(urlOrName)) {
    return urlOrName.replace(/^\/+/, '') || null;
  }

  const { publicUrl } = readAzureConfig();
  if (publicUrl && urlOrName.startsWith(`${publicUrl}/`)) {
    const rel = urlOrName.slice(publicUrl.length + 1).split(/[?#]/)[0];
    return rel ? decodeURIComponent(rel) : null;
  }

  try {
    const parsed = new URL(urlOrName);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    const prefix = `${containerName}/`;
    if (pathname.startsWith(prefix)) {
      return decodeURIComponent(pathname.slice(prefix.length)) || null;
    }
    // Fallback if container name differs from current config: strip first path segment.
    const slashIdx = pathname.indexOf('/');
    if (slashIdx > 0) {
      return decodeURIComponent(pathname.slice(slashIdx + 1)) || null;
    }
    return decodeURIComponent(pathname) || null;
  } catch {
    return null;
  }
}

export interface BlobUploadOptions {
  contentType?: string;
  cacheControl?: string;
  containerName?: string;
}

/** Upload a local file on disk to Azure Blob Storage and return its public URL. */
export async function uploadFileToBlob(
  blobName: string,
  absPath: string,
  options: BlobUploadOptions = {},
): Promise<string> {
  const containerClient = await getContainerClient(options.containerName);
  const cleanName = blobName.replace(/^\/+/, '');
  const blockClient = containerClient.getBlockBlobClient(cleanName);

  await blockClient.uploadFile(absPath, {
    blobHTTPHeaders: {
      blobContentType: options.contentType || 'application/octet-stream',
      blobCacheControl: options.cacheControl || 'public, max-age=31536000, immutable',
    },
  });

  return resolvePublicBlobUrl(blockClient.url, cleanName);
}

/** Upload an in-memory Buffer to Azure Blob Storage and return its public URL. */
export async function uploadBufferToBlob(
  blobName: string,
  data: Buffer,
  options: BlobUploadOptions = {},
): Promise<string> {
  const containerClient = await getContainerClient(options.containerName);
  const cleanName = blobName.replace(/^\/+/, '');
  const blockClient = containerClient.getBlockBlobClient(cleanName);

  await blockClient.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: options.contentType || 'application/octet-stream',
      blobCacheControl: options.cacheControl || 'public, max-age=31536000, immutable',
    },
  });

  return resolvePublicBlobUrl(blockClient.url, cleanName);
}

/** Download an Azure Blob to a local file path. Returns false if the blob does not exist. */
export async function downloadBlobToFile(
  blobUrlOrName: string,
  destPath: string,
  containerName?: string,
): Promise<boolean> {
  const container = containerName || getDefaultContainerName();
  const blobName = extractBlobNameFromUrl(blobUrlOrName, container);
  if (!blobName) return false;

  const containerClient = await getContainerClient(container);
  const blockClient = containerClient.getBlockBlobClient(blobName);
  if (!(await blockClient.exists())) return false;

  await blockClient.downloadToFile(destPath);
  return true;
}

/** Check whether a blob exists in Azure Blob Storage. */
export async function blobExists(
  blobUrlOrName: string,
  containerName?: string,
): Promise<boolean> {
  const container = containerName || getDefaultContainerName();
  const blobName = extractBlobNameFromUrl(blobUrlOrName, container);
  if (!blobName) return false;

  const containerClient = await getContainerClient(container);
  const blockClient = containerClient.getBlockBlobClient(blobName);
  return blockClient.exists();
}

/** Delete a single blob by its URL or container-relative blob name. */
export async function deleteBlob(
  blobUrlOrName: string,
  containerName?: string,
): Promise<boolean> {
  if (!isAzureBlobConfigured()) return false;
  const container = containerName || getDefaultContainerName();
  const blobName = extractBlobNameFromUrl(blobUrlOrName, container);
  if (!blobName) return false;

  const containerClient = await getContainerClient(container);
  const blockClient = containerClient.getBlockBlobClient(blobName);
  const result = await blockClient.deleteIfExists();
  return result.succeeded;
}

/** Delete every blob whose name starts with `prefix`. Returns the count deleted. */
export async function deleteBlobsByPrefix(
  prefix: string,
  containerName?: string,
): Promise<number> {
  if (!isAzureBlobConfigured()) return 0;
  const cleanPrefix = prefix.replace(/^\/+/, '');
  const containerClient = await getContainerClient(containerName);
  let deleted = 0;

  for await (const item of containerClient.listBlobsFlat({ prefix: cleanPrefix })) {
    const res = await containerClient.getBlockBlobClient(item.name).deleteIfExists();
    if (res.succeeded) deleted += 1;
  }

  return deleted;
}
