import { db } from "../db";
import { places } from "../../shared/schema";
import { OverpassService } from "../overpassService";

async function forceSync() {
  console.log("🚀 Starting forced OSM sync for banking data...");
  const overpass = OverpassService.getInstance();
  
  const types = ["bank", "atm", "caisses_populaires"];
  
  for (const type of types) {
    console.log(`Syncing ${type}...`);
    try {
      const result = await overpass.syncPlaceType(type, true);
      console.log(`✅ ${type}: Added ${result.added}, Updated ${result.updated}, Errors ${result.errors}`);
    } catch (error) {
      console.error(`❌ Error syncing ${type}:`, error);
    }
  }
  
  console.log("✨ Sync complete!");
  process.exit(0);
}

forceSync().catch(err => {
  console.error("Fatal error during sync:", err);
  process.exit(1);
});
