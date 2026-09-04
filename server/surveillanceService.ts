import { z } from "zod";
import {
  decryptSensitiveData,
  encryptSensitiveData,
} from "./encryptionService";
import {
  SurveillanceValidationError,
  validateSurveillanceEndpoint,
} from "./surveillancePreparation";
import type {
  SurveillanceCamera,
  SurveillanceCameraSummary,
} from "@shared/schema";

const connectionTypes = ["rtsp", "onvif"] as const;
const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const createCameraSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom de la caméra est obligatoire").max(120),
    description: optionalText(500),
    connectionType: z.enum(connectionTypes),
    host: z.string().trim().min(1, "L'adresse de la caméra est obligatoire").max(253),
    port: z.coerce.number().int().min(1).max(65535),
    username: optionalText(255),
    password: z.string().min(1, "Le mot de passe de la caméra est obligatoire").max(512),
    streamPath: optionalText(2048),
  })
  .strict();

const updateCameraSchema = createCameraSchema
  .omit({ password: true })
  .extend({
    password: z.string().max(512).optional(),
    status: z.enum(["unknown", "disabled"]).optional(),
  })
  .partial()
  .strict();

export type CreateSurveillanceCameraInput = z.infer<typeof createCameraSchema>;
export type UpdateSurveillanceCameraInput = z.infer<typeof updateCameraSchema>;

export interface SurveillanceCameraDto {
  id: string;
  name: string;
  description: string | null;
  connectionType: string;
  host: string;
  port: number;
  streamPath: string | null;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasCredentials: boolean;
}

function validationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "camera"}: ${issue.message}`)
    .join(", ");
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function validateEndpoint(
  data: Pick<CreateSurveillanceCameraInput, "connectionType" | "host" | "port" | "streamPath">,
) {
  try {
    return validateSurveillanceEndpoint({
      protocol: data.connectionType,
      host: data.host,
      port: data.port,
      streamPath: data.streamPath,
    });
  } catch (error) {
    if (error instanceof SurveillanceValidationError) {
      throw error;
    }
    throw new SurveillanceValidationError("Endpoint caméra invalide");
  }
}

export function parseCreateSurveillanceCamera(
  input: unknown,
): CreateSurveillanceCameraInput {
  const result = createCameraSchema.safeParse(input);
  if (!result.success) {
    throw new SurveillanceValidationError(validationMessage(result.error));
  }

  const endpoint = validateEndpoint(result.data);
  return {
    ...result.data,
    host: endpoint.host,
    port: endpoint.port,
    streamPath: endpoint.streamPath,
    description: normalizeNullableText(result.data.description),
    username: normalizeNullableText(result.data.username),
  };
}

export function parseUpdateSurveillanceCamera(
  input: unknown,
): UpdateSurveillanceCameraInput {
  const result = updateCameraSchema.safeParse(input);
  if (!result.success) {
    throw new SurveillanceValidationError(validationMessage(result.error));
  }

  if (
    result.data.connectionType !== undefined ||
    result.data.host !== undefined ||
    result.data.port !== undefined ||
    result.data.streamPath !== undefined
  ) {
    validateEndpoint({
      connectionType: result.data.connectionType ?? "rtsp",
      host: result.data.host ?? "camera-test.local",
      port: result.data.port ?? 554,
      streamPath: result.data.streamPath,
    });
  }

  return {
    ...result.data,
    description: normalizeNullableText(result.data.description),
    username: normalizeNullableText(result.data.username),
    password: result.data.password?.trim(),
  };
}

export async function encryptCameraPassword(password: string): Promise<string> {
  if (!password) {
    throw new SurveillanceValidationError("Le mot de passe de la caméra est obligatoire");
  }

  // Store the complete AES-256-GCM envelope, never the plaintext or a
  // reversible encoding. Decryption remains server/gateway-only.
  return JSON.stringify(await encryptSensitiveData(password));
}

export async function decryptCameraPassword(
  encryptedPassword: string,
): Promise<string> {
  try {
    const encrypted = JSON.parse(encryptedPassword);
    return await decryptSensitiveData(encrypted);
  } catch {
    throw new SurveillanceValidationError(
      "Les credentials de la caméra sont invalides",
    );
  }
}

export function toSurveillanceCameraDto(
  camera: SurveillanceCamera | SurveillanceCameraSummary,
): SurveillanceCameraDto {
  return {
    id: camera.id,
    name: camera.name,
    description: camera.description ?? null,
    connectionType: camera.connectionType,
    host: camera.host,
    port: camera.port,
    streamPath: camera.streamPath ?? null,
    status: camera.status,
    lastSeenAt: camera.lastSeenAt?.toISOString() ?? null,
    createdAt: camera.createdAt.toISOString(),
    updatedAt: camera.updatedAt.toISOString(),
    hasCredentials: true,
  };
}