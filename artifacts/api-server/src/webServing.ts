import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";

const defaultWebDistDir = path.resolve(
  process.cwd(),
  "artifacts",
  "burkinawatch",
  "dist",
  "public",
);

export function configureWebServing(app: Express) {
  if (process.env["SERVE_WEB"] !== "true") {
    return;
  }

  const webDistDir = path.resolve(
    process.env["WEB_DIST_DIR"] || defaultWebDistDir,
  );
  const indexPath = path.join(webDistDir, "index.html");

  if (!existsSync(indexPath)) {
    throw new Error(
      `Web build not found at "${indexPath}". Build @workspace/burkinawatch before starting with SERVE_WEB=true.`,
    );
  }

  app.use(express.static(webDistDir, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (req.path === "/api" || req.path.startsWith("/api/")) {
      next();
      return;
    }

    res.sendFile(indexPath);
  });
}