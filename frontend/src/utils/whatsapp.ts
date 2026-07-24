/** Digits-only phone for wa.me (adds India 91 when 10 digits). */
export function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function whatsappDeepLink(phone: string, prefill?: string): string {
  const base = `https://wa.me/${whatsappDigits(phone)}`;
  if (!prefill?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefill)}`;
}
