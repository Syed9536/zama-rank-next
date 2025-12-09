// scripts/fetch-seasons.js

// Node ka built-in fs + path
const fs = require("fs");
const path = require("path");

// Zamarank API
const BASE_URL = "https://zamarank.live/api/leaderboard";
// Yeh 4 seasons ka data lenge
const SEASONS = ["s1", "s2", "s3", "s4"];

// Helper: ek season ka data laana
async function fetchSeason(season) {
  const url = `${BASE_URL}/${season}`;
  console.log("Fetching:", url);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed for ${season}: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // json ka structure:
  // { season: "s1", count: 249, lastUpdated: "...", data: [ { ... } ] }
  const list = Array.isArray(json.data) ? json.data : [];

  // Hum sirf jo chahiye woh le rahe:
  const cleaned = list.map((row) => ({
    id: row.id,
    season: (row.season || season).toString().toUpperCase(), // "S1"
    rank: row.rank,
    username: row.username,
    // handle: "@abc" -> "abc"
    handle: (row.handle || "").replace(/^@/, ""),
    avatarUrl: row.avatarUrl || null,
  }));

  console.log(`  Got ${cleaned.length} rows for ${season.toUpperCase()}`);
  return cleaned;
}

async function main() {
  const out = {};

  for (const s of SEASONS) {
    const data = await fetchSeason(s);
    out[s.toUpperCase()] = data; // "s1" -> "S1"
  }

  const outDir = path.join(__dirname, "..", "data");
  const outFile = path.join(outDir, "seasons.json");

  // ensure /data folder exists
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");
  console.log("\n✅ Saved:", outFile);
}

main().catch((err) => {
  console.error("❌ Error in fetch-seasons script:");
  console.error(err);
  process.exit(1);
});
