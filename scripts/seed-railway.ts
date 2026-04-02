/**
 * Exports data from local SQLite and seeds Railway PostgreSQL.
 * Usage: npx tsx scripts/seed-railway.ts <RAILWAY_DATABASE_PUBLIC_URL>
 */
import Database from "better-sqlite3";
import pg from "pg";

async function main() {
  const SQLITE_PATH = "prisma/dev.db";
  const pgUrl = process.argv[2];

  if (!pgUrl) {
    console.error("Usage: npx tsx scripts/seed-railway.ts <DATABASE_PUBLIC_URL>");
    process.exit(1);
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const rows = sqlite.prepare("SELECT * FROM Project").all() as Record<string, unknown>[];
  console.log(`Found ${rows.length} projects in SQLite`);

  const client = new pg.Client({ connectionString: pgUrl });
  await client.connect();

  for (const row of rows) {
    const screenshotData = row.screenshotData
      ? Buffer.from(row.screenshotData as Buffer)
      : null;

    await client.query(
      `INSERT INTO "Project" (
        id, "githubName", "displayName", "githubUrl", "shortDesc", "longDesc",
        "productionUrl", "isExcluded", "displayOrder", language, stars,
        "isPrivate", "screenshotUrl", "screenshotData", "screenshotMime",
        "lastGithubSync", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT ("githubName") DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "shortDesc" = EXCLUDED."shortDesc",
        "longDesc" = EXCLUDED."longDesc",
        "productionUrl" = EXCLUDED."productionUrl",
        "isExcluded" = EXCLUDED."isExcluded",
        "displayOrder" = EXCLUDED."displayOrder",
        "screenshotUrl" = EXCLUDED."screenshotUrl",
        "screenshotData" = EXCLUDED."screenshotData",
        "screenshotMime" = EXCLUDED."screenshotMime",
        "isPrivate" = EXCLUDED."isPrivate",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        row.id,
        row.githubName,
        row.displayName || null,
        row.githubUrl,
        row.shortDesc || "",
        row.longDesc || "",
        row.productionUrl || null,
        row.isExcluded ? true : false,
        row.displayOrder || 0,
        row.language || null,
        row.stars || 0,
        row.isPrivate ? true : false,
        row.screenshotUrl || null,
        screenshotData,
        row.screenshotMime || null,
        row.lastGithubSync ? new Date(row.lastGithubSync as string) : null,
        new Date(row.createdAt as string),
        new Date(row.updatedAt as string),
      ]
    );
    console.log(`  Seeded: ${row.githubName}`);
  }

  await client.end();
  sqlite.close();
  console.log(`Done! Seeded ${rows.length} projects.`);
}

main();
