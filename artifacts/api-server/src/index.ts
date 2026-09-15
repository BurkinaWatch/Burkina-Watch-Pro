import app from "./app";
import { initializeApp } from "./app";
import { logger } from "./lib/logger";
import { configureWebServing } from "./webServing";
import { purgeExpiredPlaceExperienceData } from "./placeExperience";
import { storage } from "./storage";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initializeApp();
configureWebServing(app);
async function runRetentionPurges() {
  const [
    placeExperience,
    auditLogsDeleted,
    refreshTokensDeleted,
    moderationLogsDeleted,
  ] = await Promise.all([
    purgeExpiredPlaceExperienceData(),
    storage.purgeExpiredAuditLogs(),
    storage.purgeExpiredRefreshTokens(),
    storage.purgeExpiredModerationLogs(),
  ]);

  logger.info({
    placeExperience,
    auditLogsDeleted,
    refreshTokensDeleted,
    moderationLogsDeleted,
  }, "Retention purges completed");
}

void runRetentionPurges().catch((error) => {
  logger.error({ err: error }, "Retention purge failed");
});

setInterval(() => {
  void runRetentionPurges().catch((error) => {
    logger.error({ err: error }, "Retention purge failed");
  });
}, 6 * 60 * 60 * 1000).unref();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
