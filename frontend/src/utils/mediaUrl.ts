/**
 * Resolve media URLs for display.
 * Local uploads are stored as absolute API URLs; relative `/uploads/...`
 * paths (older records) are prefixed with the API origin.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) {
    const api = import.meta.env.VITE_API_URL as string | undefined;
    if (api) {
      try {
        return `${new URL(api).origin}${url}`;
      } catch {
        /* fall through */
      }
    }
  }
  return url;
}
