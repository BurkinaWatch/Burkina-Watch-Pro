import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicPracticalSources } from "./publicPracticalSources";

test("les sources publiques restent inactives sans configuration", async () => {
  const previous = process.env.BURKINAWATCH_PUBLIC_SOURCES;
  delete process.env.BURKINAWATCH_PUBLIC_SOURCES;

  try {
    assert.deepEqual(await fetchPublicPracticalSources("boucherie"), {
      places: [],
      items: [],
      sources: [],
    });
  } finally {
    if (previous === undefined) delete process.env.BURKINAWATCH_PUBLIC_SOURCES;
    else process.env.BURKINAWATCH_PUBLIC_SOURCES = previous;
  }
});

test("les URLs non publiques ou les configurations invalides sont ignorées", async () => {
  const previous = process.env.BURKINAWATCH_PUBLIC_SOURCES;
  process.env.BURKINAWATCH_PUBLIC_SOURCES = JSON.stringify([
    { name: "Serveur local", url: "http://127.0.0.1:8080/feed.xml", format: "rss" },
    { name: "URL non supportée", url: "file:///tmp/feed.xml", format: "rss" },
  ]);

  try {
    assert.deepEqual(await fetchPublicPracticalSources(), {
      places: [],
      items: [],
      sources: [],
    });
  } finally {
    if (previous === undefined) delete process.env.BURKINAWATCH_PUBLIC_SOURCES;
    else process.env.BURKINAWATCH_PUBLIC_SOURCES = previous;
  }
});