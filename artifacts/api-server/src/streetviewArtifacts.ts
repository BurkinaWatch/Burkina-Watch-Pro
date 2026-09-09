export function getCpuPreparationArtifactKeys(clientMetadata: unknown): string[] {
  if (!clientMetadata || typeof clientMetadata !== "object" || Array.isArray(clientMetadata)) {
    return [];
  }

  const cpuPreparation = (clientMetadata as Record<string, unknown>).cpuPreparation;
  if (!cpuPreparation || typeof cpuPreparation !== "object" || Array.isArray(cpuPreparation)) {
    return [];
  }

  const artifactKeys = (cpuPreparation as Record<string, unknown>).artifactKeys;
  return Array.isArray(artifactKeys)
    ? artifactKeys.filter((key): key is string => typeof key === "string" && key.length > 0)
    : [];
}