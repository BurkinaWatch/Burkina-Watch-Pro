import type { LocationPoint, TrackingSession } from "@workspace/db";
import { storage } from "./storage";
import { sendEmergencyTrackingSignalLostEmail } from "./emailService";

export const TRACKING_SIGNAL_LOSS_TIMEOUT_MS = 5 * 60 * 1000;
const TRACKING_SIGNAL_MONITOR_INTERVAL_MS = 60 * 1000;
const TRACKING_SIGNAL_LOST_AUDIT_ACTION = "tracking_signal_lost";
const TRACKING_SESSION_RESOURCE_TYPE = "tracking_session";

export type TrackingSignalStatus = "active" | "signal_lost" | "stopped";

export type TrackingSessionView = TrackingSession & {
  signalStatus: TrackingSignalStatus;
  lastLocationAt: Date | null;
  lastLocation: {
    latitude: string;
    longitude: string;
    accuracy: string | null;
    timestamp: Date;
  } | null;
};

function getLastLocationAt(session: TrackingSession, lastPoint?: LocationPoint): Date {
  return lastPoint?.timestamp ?? session.startTime;
}

export function getTrackingSignalStatus(
  session: TrackingSession,
  lastPoint?: LocationPoint,
  now = new Date(),
): TrackingSignalStatus {
  if (!session.isActive) return "stopped";

  const lastLocationAt = getLastLocationAt(session, lastPoint);
  return now.getTime() - lastLocationAt.getTime() >= TRACKING_SIGNAL_LOSS_TIMEOUT_MS
    ? "signal_lost"
    : "active";
}

export function toTrackingSessionView(
  session: TrackingSession,
  lastPoint?: LocationPoint,
  now = new Date(),
): TrackingSessionView {
  return {
    ...session,
    signalStatus: getTrackingSignalStatus(session, lastPoint, now),
    lastLocationAt: lastPoint?.timestamp ?? null,
    lastLocation: lastPoint
      ? {
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
          accuracy: lastPoint.accuracy,
          timestamp: lastPoint.timestamp,
        }
      : null,
  };
}

function getLiveTrackingUrl(): string {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.REPLIT_DEV_DOMAIN || process.env.APP_DOMAIN || "burkinawatch.com";
  return `https://${host.replace(/^https?:\/\//, "")}/tracking-live`;
}

async function markSignalLossAndNotify(
  session: TrackingSession,
  lastPoint: LocationPoint | undefined,
): Promise<void> {
  const alreadyAlerted = await storage.hasAuditLog(
    TRACKING_SIGNAL_LOST_AUDIT_ACTION,
    TRACKING_SESSION_RESOURCE_TYPE,
    session.id,
  );
  if (alreadyAlerted) return;

  const user = await storage.getUser(session.userId);
  const contacts = await storage.getEmergencyContacts(session.userId);
  const emailContacts = contacts.filter((contact) => Boolean(contact.email));

  // The audit row is the durable idempotency marker. It is written before
  // sending so a slow email provider or a server restart cannot duplicate the alert.
  await storage.logAudit({
    userId: session.userId,
    action: TRACKING_SIGNAL_LOST_AUDIT_ACTION,
    resourceType: TRACKING_SESSION_RESOURCE_TYPE,
    resourceId: session.id,
    details: {
      thresholdMinutes: TRACKING_SIGNAL_LOSS_TIMEOUT_MS / 60_000,
      lastLocationAt: lastPoint?.timestamp?.toISOString() ?? null,
      contactsWithEmail: emailContacts.length,
    },
    severity: "critical",
  });

  if (!user || emailContacts.length === 0) {
    console.warn(`[TRACKING] Signal perdu pour ${session.id}, aucun contact email à notifier.`);
    return;
  }

  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Utilisateur";
  const lastLocation = lastPoint
    ? {
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        timestamp: lastPoint.timestamp,
      }
    : undefined;

  const results = await Promise.allSettled(
    emailContacts.map((contact) =>
      sendEmergencyTrackingSignalLostEmail(
        contact.email!,
        contact.name,
        userName,
        getLiveTrackingUrl(),
        lastLocation,
      ),
    ),
  );
  const failures = results.filter((result) => result.status === "rejected").length;
  console.log(
    `[TRACKING] Signal perdu pour ${session.id}: ${emailContacts.length - failures}/${emailContacts.length} alertes email envoyées.`,
  );
}

export async function checkTrackingSignalLoss(): Promise<void> {
  const activeSessions = await storage.getActiveTrackingSessions();

  for (const session of activeSessions) {
    const lastPoint = await storage.getLatestLocationPointBySession(session.id);
    if (getTrackingSignalStatus(session, lastPoint) !== "signal_lost") continue;

    try {
      await markSignalLossAndNotify(session, lastPoint);
    } catch (error) {
      console.error(
        `[TRACKING] Échec de la détection de perte de signal pour ${session.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

let monitorTimer: NodeJS.Timeout | undefined;
let monitorRun: Promise<void> | undefined;

export function startTrackingSignalMonitor(): void {
  if (monitorTimer) return;

  const run = () => {
    if (monitorRun) return;
    monitorRun = checkTrackingSignalLoss()
      .catch((error) => {
        // A schema mismatch or a transient database outage must not terminate
        // the API process. Keep the failure visible and retry on the next tick.
        console.error(
          "[TRACKING] Moniteur indisponible, nouvelle tentative au prochain intervalle:",
          error instanceof Error ? error.message : error,
        );
      })
      .finally(() => {
        monitorRun = undefined;
      });
  };

  run();
  monitorTimer = setInterval(run, TRACKING_SIGNAL_MONITOR_INTERVAL_MS);
  monitorTimer.unref?.();
}