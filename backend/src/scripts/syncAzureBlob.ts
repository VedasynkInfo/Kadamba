/**
 * Check & optionally sync local `uploads/` files with Azure Blob Storage.
 *
 * Usage:
 *   npm run uploads:sync-azure               # check connection & sync status
 *   npm run uploads:sync-azure -- --sync     # upload any local files missing from Azure Blob
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { uploadsDir } from '../config/storage';
import {
  blobExists,
  getDefaultContainerName,
  isAzureBlobConfigured,
  isAzureStorageActive,
  uploadFileToBlob,
} from '../services/azureBlobService';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function walkFiles(root: string, prefix = '', out: string[] = []): string[] {
  if (!fs.existsSync(root)) return out;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      walkFiles(path.join(root, entry.name), rel, out);
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

async function main() {
  const shouldSync = process.argv.includes('--sync');
  const container = getDefaultContainerName();
  const configured = isAzureBlobConfigured();
  const active = isAzureStorageActive();

  console.log('=== Kadamba Azure Blob Storage Sync Check ===');
  console.log(`UPLOAD_STORAGE : ${env.uploadStorage}`);
  console.log(`Container      : ${container}`);
  console.log(`Credentials    : ${configured ? 'configured' : 'MISSING'}`);
  console.log(`Azure Active   : ${active ? 'YES' : 'NO (using local disk)'}`);

  if (!configured) {
    console.log('');
    console.log('Status: NOT SYNCED — Azure Blob credentials are not configured.');
    console.log('Run ./deploy-azure.sh in Azure Cloud Shell (https://shell.azure.com),');
    console.log('then copy AZURE_STORAGE_* and UPLOAD_STORAGE=azure into backend/.env.');
    process.exit(1);
  }

  const localFiles = walkFiles(uploadsDir);
  console.log(`Local files    : ${localFiles.length} in ${uploadsDir}`);

  let synced = 0;
  let missing = 0;
  let uploaded = 0;

  for (const rel of localFiles) {
    const blobName = `uploads/${rel}`;
    const exists = await blobExists(blobName, container);
    if (exists) {
      synced += 1;
      continue;
    }

    missing += 1;
    if (shouldSync) {
      const ext = path.extname(rel).toLowerCase();
      const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
      const url = await uploadFileToBlob(blobName, path.join(uploadsDir, rel), {
        contentType,
        containerName: container,
      });
      uploaded += 1;
      console.log(`  UPLOADED  ${blobName} -> ${url}`);
    } else {
      console.log(`  MISSING   ${blobName}`);
    }
  }

  console.log('');
  console.log(
    `Summary: ${synced} already in Azure Blob, ${missing} missing locally${shouldSync ? `, ${uploaded} uploaded` : ''}.`,
  );

  if (!active || (missing > 0 && !shouldSync)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Azure Blob sync check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
