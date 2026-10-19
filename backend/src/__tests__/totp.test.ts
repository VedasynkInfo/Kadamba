import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  buildOtpauthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  hotp,
  normalizeBackupCode,
  totp,
  verifyTotp,
} from '../utils/totp';

describe('TOTP (RFC 6238)', () => {
  it('matches the RFC 6238 SHA-1 test vectors', () => {
    // The RFC uses the ASCII secret "12345678901234567890".
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(base32Decode(secret).toString('utf8')).toBe('12345678901234567890');

    // RFC vectors are 8 digits; our implementation is parameterised for digits.
    expect(hotp(secret, Math.floor(59 / 30), 8)).toBe('94287082');
    expect(hotp(secret, Math.floor(1111111109 / 30), 8)).toBe('07081804');
    expect(hotp(secret, Math.floor(20000000000 / 30), 8)).toBe('65353130');
  });

  it('accepts the current code and rejects a wrong one', () => {
    const secret = generateTotpSecret();
    const code = totp(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, 'abc')).toBe(false);
  });

  it('tolerates one step of clock drift in each direction', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const previous = totp(secret, now - 30_000);
    const next = totp(secret, now + 30_000);

    expect(verifyTotp(secret, previous, now)).toBe(true);
    expect(verifyTotp(secret, next, now)).toBe(true);
    // Two steps away must not be accepted.
    expect(verifyTotp(secret, totp(secret, now - 120_000), now)).toBe(false);
  });

  it('produces a scannable otpauth URI', () => {
    const secret = generateTotpSecret();
    const uri = buildOtpauthUri({ secret, accountName: 'admin@kadamba.local' });
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('generates unique, format-stable recovery codes', () => {
    const codes = generateBackupCodes(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    // Hashing is normalisation-insensitive so users can type lowercase/spaces.
    const hash = hashBackupCode(codes[0]);
    expect(normalizeBackupCode(codes[0].toLowerCase().replace('-', ' '))).toBe(
      normalizeBackupCode(codes[0]),
    );
    expect(hashBackupCode(codes[0].toLowerCase())).toBe(hash);
  });
});
