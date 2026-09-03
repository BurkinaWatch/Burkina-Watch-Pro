console.error(
  "db:push est désactivé : Railway PostgreSQL est la base de production. " +
    "Préparez, relisez et validez une migration forward-only avant toute application.",
);
process.exitCode = 1;