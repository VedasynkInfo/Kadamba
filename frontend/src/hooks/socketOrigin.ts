function socketOrigin(): string {
  const api = import.meta.env.VITE_API_URL as string | undefined;
  if (api) {
    try {
      return new URL(api).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

export { socketOrigin };
