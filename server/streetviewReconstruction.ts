import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ReconstructionAvailability =
  | { status: "AVAILABLE"; engine: string; version: string }
  | { status: "WAITING_FOR_GPU"; reason: string }
  | { status: "UNAVAILABLE"; reason: string };

export type ReconstructionInput = {
  contributionId: string;
  artifactKeys: string[];
  qualityMetrics: Record<string, unknown>;
};

export type ReconstructionResult =
  | {
      status: "COMPLETED";
      engine: string;
      version: string;
      artifacts: Array<{ kind: string; storageKey: string }>;
      qualityMetrics: Record<string, unknown>;
    }
  | {
      status: "WAITING_FOR_GPU" | "UNAVAILABLE";
      reason: string;
    };

export interface ReconstructionEngine {
  getAvailability(): Promise<ReconstructionAvailability>;
  reconstruct(input: ReconstructionInput): Promise<ReconstructionResult>;
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync("sh", ["-c", `command -v ${command}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * CPU engine boundary for Phase 14.
 *
 * It deliberately does not claim that COLMAP is a working reconstruction
 * backend. A validated adapter can be added later without changing the queue,
 * storage, contribution API, or scene contract.
 */
export class CpuReconstructionEngine implements ReconstructionEngine {
  constructor(
    private readonly commandExistsFn: (command: string) => Promise<boolean> = commandExists,
  ) {}

  async getAvailability(): Promise<ReconstructionAvailability> {
    if (process.env.STREETVIEW_CPU_SFM_ENABLED !== "true") {
      return {
        status: "WAITING_FOR_GPU",
        reason: "Aucun moteur SfM CPU validé n'est activé.",
      };
    }

    if (!(await this.commandExistsFn("colmap"))) {
      return {
        status: "UNAVAILABLE",
        reason: "COLMAP n'est pas installé dans cet environnement CPU.",
      };
    }

    return {
      status: "UNAVAILABLE",
      reason: "COLMAP est détecté, mais l'adaptateur SfM CPU n'a pas encore été validé sur le dataset cible.",
    };
  }

  async reconstruct(_input: ReconstructionInput): Promise<ReconstructionResult> {
    const availability = await this.getAvailability();
    if (availability.status !== "AVAILABLE") return availability;
    return {
      status: "UNAVAILABLE",
      reason: "Aucun résultat de reconstruction ne peut être publié sans adaptateur validé.",
    };
  }
}

export const cpuReconstructionEngine = new CpuReconstructionEngine();