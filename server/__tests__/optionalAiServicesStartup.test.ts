import assert from "node:assert/strict";
import { describe, test } from "node:test";

async function withEnvironment<T>(
  values: Record<string, string | undefined>,
  callback: () => Promise<T>,
): Promise<T> {
  const previous = new Map(
    Object.keys(values).map((name) => [name, process.env[name]]),
  );

  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  try {
    return await callback();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

describe("services IA optionnels", () => {
  test("démarre et conserve ses fallbacks quand la clé OpenAI est vide", async () => {
    await withEnvironment(
      {
        OPENAI_API_KEY: "",
        RAILWAY_DATABASE_URL: "postgresql://startup-test",
      },
      async () => {
        const [{ moderateContent }, { verifySignalement }, { storage }] =
          await Promise.all([
            import("../contentModeration?optional-ai-startup"),
            import("../aiVerification?optional-ai-startup"),
            import("../storage"),
          ]);

        const originalGetSignalements = storage.getSignalements;
        storage.getSignalements = async () => [];

        try {
          const approved = await moderateContent(
            "La situation est calme et sous contrôle.",
            "commentaire",
          );
          assert.deepEqual(approved, {
            isApproved: true,
            severity: "safe",
            flaggedWords: [],
          });

          const blocked = await moderateContent(
            "Il faut tuer les habitants.",
            "commentaire",
          );
          assert.equal(blocked.isApproved, false);
          assert.equal(blocked.severity, "blocked");
          assert.deepEqual(blocked.flaggedWords, ["violence explicite"]);

          const verification = await verifySignalement({
            categorie: "sécurité",
            latitude: "12.3714",
            longitude: "-1.5197",
            titre: "Incident signalé",
            description: "Un incident est en cours près du marché.",
            photo: "data:image/png;base64,test",
          });

          assert.equal(verification.score, 73);
          assert.equal(verification.status, "verified");
          assert.ok(
            verification.reasons.includes(
              "Analyse non disponible (clé API manquante)",
            ),
          );
          assert.ok(verification.reasons.includes("Qualité image: 70/100"));
        } finally {
          storage.getSignalements = originalGetSignalements;
        }
      },
    );
  });
});