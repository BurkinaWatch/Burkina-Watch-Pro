import { streetviewWorker } from "./streetviewWorker";
import { assertProductionSecurityConfiguration } from "./securityConfig";
import { assertStreetviewStorageConfigured } from "./streetviewStorage";

assertProductionSecurityConfiguration();
assertStreetviewStorageConfigured();

await streetviewWorker.start();

const shutdown = async (signal: string) => {
  console.log(`[StreetView] worker received ${signal}`);
  await streetviewWorker.stop();
  process.exit(0);
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));