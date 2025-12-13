import { db } from "../db";
import { 
  ouaga3dImageAssets, 
  ouaga3dSceneTiles, 
  ouaga3dReconstructionJobs, 
  ouaga3dCoverage, 
  ouaga3dSchedulerRuns,
  streetviewPoints,
  type InsertOuaga3dImageAsset,
  type InsertOuaga3dSchedulerRun,
  type Ouaga3dStats
} from "@shared/schema";
import { eq, sql, and, desc, count } from "drizzle-orm";

const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN || "";

const OUAGADOUGOU_BOUNDS = {
  minLat: 12.30,
  maxLat: 12.45,
  minLng: -1.60,
  maxLng: -1.45
};

const OUAGADOUGOU_ZONES = [
  { name: "Centre-ville", lat: 12.3657, lng: -1.5228 },
  { name: "Ouaga 2000", lat: 12.3400, lng: -1.4800 },
  { name: "Tampouy", lat: 12.3900, lng: -1.5300 },
  { name: "Dassasgho", lat: 12.3800, lng: -1.4900 },
  { name: "Gounghin", lat: 12.3600, lng: -1.5400 },
  { name: "Pissy", lat: 12.3500, lng: -1.5600 },
  { name: "Karpala", lat: 12.3200, lng: -1.5100 },
  { name: "Patte d'Oie", lat: 12.3550, lng: -1.5000 },
];

interface ImageAssetInput {
  source: string;
  sourceAssetId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  pitch?: number;
  captureDate?: Date;
  license?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  providerMeta?: Record<string, any>;
}

interface ProviderResult {
  imagesFound: number;
  imagesAdded: number;
  imagesDuplicate: number;
  success: boolean;
  error?: string;
}

function latLngToQuadkey(lat: number, lng: number, zoom: number = 15): string {
  const latRad = lat * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  let quadkey = "";
  for (let i = zoom; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if ((x & mask) !== 0) digit += 1;
    if ((y & mask) !== 0) digit += 2;
    quadkey += digit.toString();
  }
  return quadkey;
}

async function fetchMapillaryImages(zone: { lat: number; lng: number }, radius: number = 0.01): Promise<ImageAssetInput[]> {
  if (!MAPILLARY_TOKEN) {
    console.log("⚠️ Mapillary token non configuré");
    return [];
  }

  const minLng = (zone.lng - radius).toFixed(4);
  const minLat = (zone.lat - radius).toFixed(4);
  const maxLng = (zone.lng + radius).toFixed(4);
  const maxLat = (zone.lat + radius).toFixed(4);

  const url = `https://graph.mapillary.com/images?fields=id,geometry,captured_at,compass_angle,thumb_1024_url,thumb_256_url&bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=50`;

  try {
    const response = await fetch(url, {
      headers: { "Authorization": `OAuth ${MAPILLARY_TOKEN}` }
    });

    if (!response.ok) {
      console.error(`Mapillary API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((img: any) => ({
      source: "mapillary",
      sourceAssetId: img.id,
      latitude: img.geometry?.coordinates?.[1] || zone.lat,
      longitude: img.geometry?.coordinates?.[0] || zone.lng,
      heading: img.compass_angle,
      captureDate: img.captured_at ? new Date(img.captured_at) : undefined,
      license: "CC-BY-SA",
      imageUrl: img.thumb_1024_url,
      thumbnailUrl: img.thumb_256_url,
      providerMeta: { mapillaryId: img.id }
    }));
  } catch (error) {
    console.error("Erreur fetch Mapillary:", error);
    return [];
  }
}

async function fetchCitizenImages(): Promise<ImageAssetInput[]> {
  try {
    const citizenPhotos = await db.select().from(streetviewPoints).limit(100);
    
    return citizenPhotos.map(photo => ({
      source: "citizen",
      sourceAssetId: photo.id,
      latitude: parseFloat(photo.latitude),
      longitude: parseFloat(photo.longitude),
      heading: photo.heading ? parseFloat(photo.heading) : undefined,
      pitch: photo.pitch ? parseFloat(photo.pitch) : undefined,
      captureDate: photo.capturedAt,
      license: "citizen-contribution",
      providerMeta: { deviceInfo: photo.deviceInfo }
    }));
  } catch (error) {
    console.error("Erreur fetch citizen images:", error);
    return [];
  }
}

async function storeImageAsset(asset: ImageAssetInput): Promise<{ added: boolean; duplicate: boolean }> {
  try {
    const existing = await db.select({ id: ouaga3dImageAssets.id })
      .from(ouaga3dImageAssets)
      .where(and(
        eq(ouaga3dImageAssets.source, asset.source),
        eq(ouaga3dImageAssets.sourceAssetId, asset.sourceAssetId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { added: false, duplicate: true };
    }

    await db.insert(ouaga3dImageAssets).values({
      source: asset.source,
      sourceAssetId: asset.sourceAssetId,
      latitude: asset.latitude.toString(),
      longitude: asset.longitude.toString(),
      altitude: asset.altitude?.toString(),
      heading: asset.heading?.toString(),
      pitch: asset.pitch?.toString(),
      captureDate: asset.captureDate,
      license: asset.license,
      imageUrl: asset.imageUrl,
      thumbnailUrl: asset.thumbnailUrl,
      providerMeta: asset.providerMeta
    });

    return { added: true, duplicate: false };
  } catch (error: any) {
    if (error.code === "23505") {
      return { added: false, duplicate: true };
    }
    throw error;
  }
}

async function updateCoverage(lat: number, lng: number): Promise<void> {
  const quadkey = latLngToQuadkey(lat, lng, 15);
  
  try {
    const existing = await db.select()
      .from(ouaga3dCoverage)
      .where(eq(ouaga3dCoverage.quadkey, quadkey))
      .limit(1);

    if (existing.length > 0) {
      await db.update(ouaga3dCoverage)
        .set({ 
          imageCount: sql`${ouaga3dCoverage.imageCount} + 1`,
          lastUpdated: new Date()
        })
        .where(eq(ouaga3dCoverage.quadkey, quadkey));
    } else {
      await db.insert(ouaga3dCoverage).values({
        quadkey,
        centerLat: lat.toString(),
        centerLng: lng.toString(),
        imageCount: 1
      });
    }
  } catch (error) {
    console.error("Erreur update coverage:", error);
  }
}

async function runProviderIngestion(provider: string): Promise<ProviderResult> {
  const startTime = Date.now();
  let imagesFound = 0;
  let imagesAdded = 0;
  let imagesDuplicate = 0;
  let errorMessage: string | undefined;

  try {
    let assets: ImageAssetInput[] = [];

    if (provider === "mapillary") {
      for (const zone of OUAGADOUGOU_ZONES) {
        const zoneAssets = await fetchMapillaryImages(zone);
        assets = assets.concat(zoneAssets);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else if (provider === "citizen") {
      assets = await fetchCitizenImages();
    }

    imagesFound = assets.length;

    for (const asset of assets) {
      try {
        const result = await storeImageAsset(asset);
        if (result.added) {
          imagesAdded++;
          await updateCoverage(asset.latitude, asset.longitude);
        }
        if (result.duplicate) {
          imagesDuplicate++;
        }
      } catch (error) {
        console.error("Erreur stockage asset:", error);
      }
    }

    const durationMs = Date.now() - startTime;

    await db.insert(ouaga3dSchedulerRuns).values({
      provider,
      imagesFound,
      imagesAdded,
      imagesDuplicate,
      success: true,
      durationMs
    });

    return { imagesFound, imagesAdded, imagesDuplicate, success: true };
  } catch (error: any) {
    errorMessage = error.message || "Unknown error";
    
    await db.insert(ouaga3dSchedulerRuns).values({
      provider,
      imagesFound,
      imagesAdded,
      imagesDuplicate,
      success: false,
      errorMessage,
      durationMs: Date.now() - startTime
    });

    return { imagesFound, imagesAdded, imagesDuplicate, success: false, error: errorMessage };
  }
}

async function runDailyIngestion(): Promise<void> {
  console.log("🌍 Démarrage de l'ingestion quotidienne Ouaga en 3D...");
  
  const providers = ["mapillary", "citizen"];
  
  for (const provider of providers) {
    console.log(`📸 Ingestion depuis ${provider}...`);
    const result = await runProviderIngestion(provider);
    console.log(`✅ ${provider}: ${result.imagesAdded} nouvelles images (${result.imagesDuplicate} doublons sur ${result.imagesFound} trouvées)`);
  }

  console.log("🎉 Ingestion quotidienne terminée");
}

async function getOuaga3dStats(): Promise<Ouaga3dStats> {
  try {
    const [totalImagesResult] = await db.select({ count: count() }).from(ouaga3dImageAssets);
    const [totalScenesResult] = await db.select({ count: count() }).from(ouaga3dSceneTiles);
    
    const sourceStats = await db.select({
      source: ouaga3dImageAssets.source,
      count: count()
    })
    .from(ouaga3dImageAssets)
    .groupBy(ouaga3dImageAssets.source);

    const [coverageResult] = await db.select({
      total: count(),
      withTiles: sql<number>`COUNT(CASE WHEN ${ouaga3dCoverage.hasSceneTile} THEN 1 END)`
    }).from(ouaga3dCoverage);

    const [lastRun] = await db.select({ runDate: ouaga3dSchedulerRuns.runDate })
      .from(ouaga3dSchedulerRuns)
      .where(eq(ouaga3dSchedulerRuns.success, true))
      .orderBy(desc(ouaga3dSchedulerRuns.runDate))
      .limit(1);

    const [jobsStats] = await db.select({
      completed: sql<number>`COUNT(CASE WHEN ${ouaga3dReconstructionJobs.status} = 'completed' THEN 1 END)`,
      pending: sql<number>`COUNT(CASE WHEN ${ouaga3dReconstructionJobs.status} = 'pending' THEN 1 END)`
    }).from(ouaga3dReconstructionJobs);

    const imagesBySource: Record<string, number> = {};
    for (const stat of sourceStats) {
      imagesBySource[stat.source] = stat.count;
    }

    const totalZones = coverageResult?.total || 0;
    const zonesWithTiles = coverageResult?.withTiles || 0;
    const coveragePercent = totalZones > 0 ? Math.round((zonesWithTiles / totalZones) * 100) : 0;

    return {
      totalImages: totalImagesResult?.count || 0,
      totalScenes: totalScenesResult?.count || 0,
      coveragePercent,
      lastUpdate: lastRun?.runDate?.toISOString() || null,
      imagesBySource,
      jobsCompleted: jobsStats?.completed || 0,
      jobsPending: jobsStats?.pending || 0
    };
  } catch (error) {
    console.error("Erreur getOuaga3dStats:", error);
    return {
      totalImages: 0,
      totalScenes: 0,
      coveragePercent: 0,
      lastUpdate: null,
      imagesBySource: {},
      jobsCompleted: 0,
      jobsPending: 0
    };
  }
}

async function getImageAssets(options: { 
  limit?: number; 
  offset?: number; 
  source?: string;
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}) {
  const { limit = 100, offset = 0, source, bounds } = options;
  
  let query = db.select().from(ouaga3dImageAssets);
  
  if (source) {
    query = query.where(eq(ouaga3dImageAssets.source, source)) as typeof query;
  }
  
  return query
    .orderBy(desc(ouaga3dImageAssets.addedAt))
    .limit(limit)
    .offset(offset);
}

async function getCoverageData() {
  return db.select().from(ouaga3dCoverage).orderBy(desc(ouaga3dCoverage.imageCount));
}

async function getRecentJobs(limit: number = 10) {
  return db.select()
    .from(ouaga3dReconstructionJobs)
    .orderBy(desc(ouaga3dReconstructionJobs.createdAt))
    .limit(limit);
}

async function triggerManualIngestion(): Promise<{ success: boolean; message: string }> {
  try {
    await runDailyIngestion();
    return { success: true, message: "Ingestion manuelle terminée avec succès" };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur lors de l'ingestion" };
  }
}

function scheduleAutoUpdate(): void {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(2, 0, 0, 0);
  
  if (midnight.getTime() <= now.getTime()) {
    midnight.setDate(midnight.getDate() + 1);
  }
  
  const msUntilMidnight = midnight.getTime() - now.getTime();
  const minutesUntil = Math.floor(msUntilMidnight / 60000);
  
  console.log("🌍 Service Ouaga en 3D initialisé");
  console.log(`⏰ Prochaine ingestion automatique dans ${minutesUntil} minutes (02h00)`);
  
  setTimeout(() => {
    runDailyIngestion();
    setInterval(() => {
      runDailyIngestion();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

export const ouaga3dService = {
  runDailyIngestion,
  getOuaga3dStats,
  getImageAssets,
  getCoverageData,
  getRecentJobs,
  triggerManualIngestion,
  scheduleAutoUpdate,
  OUAGADOUGOU_BOUNDS,
  OUAGADOUGOU_ZONES
};
