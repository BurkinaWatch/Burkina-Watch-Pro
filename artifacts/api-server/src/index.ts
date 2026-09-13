import app from "./app";
import { initializeApp } from "./app";
import { logger } from "./lib/logger";
import { configureWebServing } from "./webServing";
import { purgeExpiredPlaceExperienceData } from "./placeExperience";

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
void purgeExpiredPlaceExperienceData().catch((error) => {
  logger.error({ err: error }, "Place experience retention purge failed");
});
setInterval(() => {
  void purgeExpiredPlaceExperienceData().catch((error) => {
    logger.error({ err: error }, "Place experience retention purge failed");
  });
}, 6 * 60 * 60 * 1000).unref();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
