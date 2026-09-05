import { streetviewWorker } from "./streetviewWorker";
import { assertProductionSecurityConfiguration } from "./securityConfig";
import { assertStreetviewStorageConfigured } from "./streetviewStorage";

assertProductionSecurityConfiguration();
assertStreetviewStorageConfigured();

const shutdown = async (signal: string) => {
  console.log(`[StreetView] worker received ${signal}`);
  await streetviewWorker.stop();
  process.exit(0);
};

async function main(): Promise<void> {
  await streetviewWorker.start();
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[StreetView] worker failed to start:", error);
  process.exit(1);
});