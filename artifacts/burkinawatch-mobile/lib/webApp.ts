function normalizeUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol).toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getWebAppUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configuredUrl) return normalizeUrl(configuredUrl);

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  const origin = domain ? normalizeUrl(domain) : null;
  return origin;
}