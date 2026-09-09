import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

function isBlockedIpv4(ip: string, allowPrivateNetworks = false): boolean {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    (!allowPrivateNetworks && a === 10) ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (!allowPrivateNetworks && a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (!allowPrivateNetworks && a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function parseIpv6(ip: string): number[] | undefined {
  let value = ip.toLowerCase();
  const zoneIndex = value.indexOf("%");
  if (zoneIndex >= 0) {
    value = value.slice(0, zoneIndex);
  }

  if (value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const ipv4 = value.slice(lastColon + 1);
    if (net.isIP(ipv4) !== 4) {
      return undefined;
    }
    const [a, b, c, d] = ipv4.split(".").map(Number);
    const high = ((a << 8) | b).toString(16);
    const low = ((c << 8) | d).toString(16);
    value = `${value.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = value.split("::");
  if (halves.length > 2) {
    return undefined;
  }

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) {
    return undefined;
  }

  const parts = [...head, ...Array(missing).fill("0"), ...tail];
  if (parts.length !== 8 || parts.some((part) => !/^[\da-f]{1,4}$/.test(part))) {
    return undefined;
  }

  return parts.map((part) => Number.parseInt(part, 16));
}

export function isBlockedIp(
  ip: string,
  options: { allowPrivateNetworks?: boolean } = {},
): boolean {
  const allowPrivateNetworks = options.allowPrivateNetworks === true;
  const normalized = ip.replace(/^\[|\]$/g, "");
  const version = net.isIP(normalized);

  if (version === 4) {
    return isBlockedIpv4(normalized, allowPrivateNetworks);
  }

  if (version !== 6) {
    return true;
  }

  const parts = parseIpv6(normalized);
  if (!parts) {
    return true;
  }

  const isIpv4Mapped =
    parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff;
  if (isIpv4Mapped) {
    const ipv4 = [
      parts[6] >> 8,
      parts[6] & 0xff,
      parts[7] >> 8,
      parts[7] & 0xff,
    ].join(".");
    return isBlockedIpv4(ipv4, allowPrivateNetworks);
  }

  const isUnspecified = parts.every((part) => part === 0);
  const isLoopback = parts.slice(0, 7).every((part) => part === 0) && parts[7] === 1;

  return (
    isUnspecified ||
    isLoopback ||
    (parts[0] & 0xfe00) === 0xfc00 || // fc00::/7
    (parts[0] & 0xffc0) === 0xfe80 || // fe80::/10
    (parts[0] & 0xff00) === 0xff00 // multicast
  );
}

export class OutboundUrlValidationError extends Error {
  constructor(message = "Adresse de connexion sortante non autorisée") {
    super(message);
    this.name = "OutboundUrlValidationError";
  }
}

export async function validateOutboundUrl(
  rawUrl: string,
  options: {
    allowedProtocols?: readonly string[];
    allowCredentials?: boolean;
    allowPrivateNetworks?: boolean;
  } = {},
): Promise<URL> {
  const allowedProtocols = options.allowedProtocols || ["https"];
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new OutboundUrlValidationError("URL sortante invalide");
  }

  const protocol = url.protocol.replace(/:$/, "");
  if (!allowedProtocols.includes(protocol)) {
    throw new OutboundUrlValidationError("Schéma d'URL non autorisé");
  }

  if (!options.allowCredentials && (url.username || url.password)) {
    throw new OutboundUrlValidationError(
      "Les credentials doivent être transmis séparément et chiffrés",
    );
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new OutboundUrlValidationError();
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname, options)) {
      throw new OutboundUrlValidationError();
    }
    return url;
  }

  try {
    const resolvedAddresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });

    if (
      resolvedAddresses.length === 0 ||
      resolvedAddresses.some((address) =>
        isBlockedIp(address.address, options),
      )
    ) {
      throw new OutboundUrlValidationError();
    }

    return url;
  } catch (error) {
    if (error instanceof OutboundUrlValidationError) {
      throw error;
    }
    throw new OutboundUrlValidationError("Hôte sortant introuvable");
  }
}