import crypto from 'crypto';

/**
 * Minimal RFC 6238 TOTP implementation (SHA-1, 6 digits, 30s step).
 *
 * Implemented in-house to avoid a native/extra runtime dependency. Verified
 * against the RFC test vectors in `__tests__/totp.test.ts`.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DIGITS = 6;
const PERIOD_SECONDS = 30;
/** Accept the previous/next step to tolerate clock skew. */
const DRIFT_STEPS = 1;

/** Generate a 160-bit base32 secret (RFC 4226 recommends ≥128 bits). */
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');

  let secret = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return secret;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character');
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** HMAC-based one-time password for a specific counter value. */
export function hotp(secret: string, counter: number, digits = DIGITS): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  // Counter is a 64-bit big-endian integer.
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);

  const digest = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, '0');
}

/** Current TOTP for a secret (used for tests and enrollment display). */
export function totp(secret: string, timestampMs = Date.now()): string {
  return hotp(secret, Math.floor(timestampMs / 1000 / PERIOD_SECONDS));
}

/**
 * Verify a submitted code with ±1 step drift.
 * Uses a constant-time comparison to avoid leaking digit-by-digit timing.
 */
export function verifyTotp(secret: string, token: string, timestampMs = Date.now()): boolean {
  const candidate = String(token ?? '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(candidate)) return false;

  const step = Math.floor(timestampMs / 1000 / PERIOD_SECONDS);
  let match = false;
  for (let drift = -DRIFT_STEPS; drift <= DRIFT_STEPS; drift += 1) {
    const expected = hotp(secret, step + drift);
    const a = Buffer.from(expected);
    const b = Buffer.from(candidate);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      match = true;
    }
  }
  return match;
}

/** `otpauth://` URI for authenticator apps (Google Authenticator, 1Password…). */
export function buildOtpauthUri(input: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = input.issuer || 'Kadamba Studio';
  const label = encodeURIComponent(`${issuer}:${input.accountName}`);
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Human-friendly recovery codes, e.g. `K7F2-9QMX`. */
export function generateBackupCodes(count = 8): string[] {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let code = '';
    for (let j = 0; j < 8; j += 1) {
      code += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/** Normalise a recovery code before hashing (case/format insensitive). */
export function normalizeBackupCode(code: string): string {
  return String(code ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(normalizeBackupCode(code)).digest('hex');
}
