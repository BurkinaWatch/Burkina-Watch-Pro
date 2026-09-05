import { streetviewWorker } from "./streetviewWorker";
import { assertProductionSecurityConfiguration } from "./securityConfig";
import { assertStreetviewStorageConfigured } from "./streetviewStorage";

assertProductionSecurityConfiguration();
assertStreetviewStorageConfigured();

if (process.env.STREETVIEW_PHASE14_ENABLED !== "true") {
  throw new Error(
    "STREETVIEW_PHASE14_ENABLED=true est requis après application et validation de la migration 0010.",
  );
}

const shutdown = async (signal: string) => {
  console.log(`[StreetView] worker received ${signal}`);
  await streetviewWorker.stop();
  process.exit(0);
};

async function main(): Promise<void> {
  if (process.env.STREETVIEW_WORKER_ENABLED !== "true") {
    throw new Error("STREETVIEW_WORKER_ENABLED=true est requis pour démarrer le worker StreetView.");
  }
  await streetviewWorker.start();
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[StreetView] worker failed to start:", error);
  process.exit(1);
});