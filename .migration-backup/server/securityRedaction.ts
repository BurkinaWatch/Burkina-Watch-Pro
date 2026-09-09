const SENSITIVE_KEY_PATTERN =
  /(password|passphrase|token|session|otp|code|secret|credential|authorization|cookie|sdp|ice)/i;
const URL_CREDENTIAL_PATTERN =
  /([a-z][a-z\d+.-]*:\/\/)([^/\s:@]+)(?::[^/\s@]*)?@/gi;
const SENSITIVE_QUERY_PATTERN =
  /([?&](?:token|access_token|refresh_token|signature|sig|secret|key|credential|password|code)=)[^&#\s]+/gi;

export function redactSensitiveText(value: string): string {
  return value
    .replace(URL_CREDENTIAL_PATTERN, "$1[REDACTED]@")
    .replace(SENSITIVE_QUERY_PATTERN, "$1[REDACTED]");
}

export function redactSensitiveData(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (value && typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactSensitiveData(item),
      ]),
    );
  }

  return value;
}