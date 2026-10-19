/**
 * Magic-byte (file signature) detection for uploaded media.
 *
 * We never trust the client-supplied `Content-Type`. Instead we inspect the
 * first bytes of the buffer and compare against known image/video signatures.
 * This closes the stored-XSS hole where a `.html`/`.svg` payload is sent with
 * `Content-Type: image/png` and later served inline by the static handler.
 *
 * SVG is intentionally NOT supported — it is XML and can execute script when
 * rendered inline, so it is rejected outright.
 */

export interface DetectedFile {
  mime: string;
  ext: string;
}

/** Only these formats are ever accepted from uploads. */
export const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function ascii(buf: Buffer, offset: number, length: number): string {
  if (buf.length < offset + length) return '';
  return buf.subarray(offset, offset + length).toString('latin1');
}

/**
 * Detect the real media type from a buffer's magic bytes.
 * Returns `undefined` when the signature is unknown or unsupported (incl. SVG/HTML).
 */
export function detectFileType(buf: Buffer): DetectedFile | undefined {
  if (!buf || buf.length < 12) return undefined;

  // JPEG: FF D8 FF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' };
  }

  // GIF87a / GIF89a
  const gif = ascii(buf, 0, 4);
  if (gif === 'GIF8' && (buf[4] === 0x37 || buf[4] === 0x39)) {
    return { mime: 'image/gif', ext: 'gif' };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // BMP: "BM"
  if (buf[0] === 0x42 && buf[1] === 0x4d) return { mime: 'image/bmp', ext: 'bmp' };

  // MP4 / MOV / AVIF / HEIC family: an ISO-BMFF "ftyp" box at offset 4.
  if (ascii(buf, 4, 4) === 'ftyp') {
    const brand = ascii(buf, 8, 4).trim().toLowerCase();
    if (brand === 'avif' || brand === 'avis') return { mime: 'image/avif', ext: 'avif' };
    if (brand === 'qt') return { mime: 'video/quicktime', ext: 'mov' };
    // mp41, mp42, isom, iso2, mmp4, dash, etc.
    if (/^(mp4|iso|isom|mmp4|dash|avc1|3gp)/.test(brand)) {
      return { mime: 'video/mp4', ext: 'mp4' };
    }
    return undefined; // unknown ISO-BMFF brand (e.g. heic) — reject
  }

  // WebM / Matroska: 1A 45 DF A3
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mime: 'video/webm', ext: 'webm' };
  }

  return undefined;
}

/** Convenience guard: is this buffer an allowed upload by its real signature? */
export function isAllowedUpload(buf: Buffer): boolean {
  const detected = detectFileType(buf);
  return Boolean(detected && ALLOWED_UPLOAD_MIMES.has(detected.mime));
}
