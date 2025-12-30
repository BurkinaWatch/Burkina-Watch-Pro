import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions, signalements } from '@shared/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@burkinawatch.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('Web Push configured');
} else {
  console.log('Web Push not configured (missing VAPID keys)');
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  signalementId?: string;
  tag?: string;
}

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(
  userId: string | null,
  subscription: SubscriptionData,
  latitude?: number,
  longitude?: number,
  radiusKm?: number
): Promise<void> {
  await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    radiusKm: radiusKm || 5,
    isActive: true,
  }).onConflictDoUpdate({
    target: pushSubscriptions.endpoint,
    set: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      radiusKm: radiusKm || 5,
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

export async function updateSubscriptionLocation(
  endpoint: string,
  latitude: number,
  longitude: number,
  radiusKm?: number
): Promise<void> {
  await db.update(pushSubscriptions)
    .set({
      latitude: String(latitude),
      longitude: String(longitude),
      radiusKm: radiusKm || 5,
      updatedAt: new Date(),
    })
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Push notifications not configured');
    return 0;
  }

  const subscriptions = await db.select()
    .from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.isActive, true)
    ));
  
  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscription(sub.endpoint);
      } else {
        console.error('Push notification error:', error);
      }
    }
  }
  
  return sent;
}

export async function sendPushToNearbySubscriptions(
  latitude: number,
  longitude: number,
  payload: PushPayload,
  excludeUserId?: string
): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return 0;
  }

  const subscriptions = await db.select()
    .from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.isActive, true),
      isNotNull(pushSubscriptions.latitude),
      isNotNull(pushSubscriptions.longitude)
    ));

  let totalSent = 0;
  
  for (const sub of subscriptions) {
    if (excludeUserId && sub.userId === excludeUserId) continue;
    if (!sub.latitude || !sub.longitude) continue;
    
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(sub.latitude),
      parseFloat(sub.longitude)
    );
    
    const radiusKm = sub.radiusKm || 5;
    
    if (distance <= radiusKm) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
        totalSent++;
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await removeSubscription(sub.endpoint);
        } else {
          console.error('Push notification error:', error);
        }
      }
    }
  }

  return totalSent;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function notifyNewSignalement(signalementId: string): Promise<number> {
  const [signalement] = await db.select().from(signalements).where(eq(signalements.id, signalementId));
  
  if (!signalement) return 0;

  const lat = parseFloat(signalement.latitude);
  const lon = parseFloat(signalement.longitude);

  const payload: PushPayload = {
    title: `Alerte: ${signalement.categorie}`,
    body: signalement.titre,
    url: `/signalement/${signalement.id}`,
    signalementId: signalement.id,
    tag: `signalement-${signalement.id}`,
  };

  return await sendPushToNearbySubscriptions(lat, lon, payload, signalement.userId || undefined);
}

export async function sendPushToAll(payload: PushPayload): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return 0;
  }

  const subscriptions = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, true));

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscription(sub.endpoint);
      }
    }
  }

  return sent;
}
