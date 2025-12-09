// app/api/find-rank/route.ts
import { NextRequest, NextResponse } from "next/server";
import seasons from "@/data/seasons.json";
// <-- S1–S4 FULL DATA READY

// LIVE Season 5 Leaderboard (24h / 7d / 30d)
const LEADERBOARD_BASE = "https://leaderboard-bice-mu.vercel.app/api/zama";

const MAX_PAGES = 15;
const TIMEFRAMES = ["24h", "7d", "30d"] as const;

// ---------- TYPES ----------
type LeaderRow = {
  rank?: number;
  position?: number;
  username?: string;
  displayName?: string;
  mindshare?: number;
};

type TFResult = {
  timeframe: string;
  rank?: number | null;
  page?: number;
  username?: string;
  displayName?: string;
  mindshare?: number;
  found?: boolean;
};

type HistorySeason = {
  season: string; // "S1" | "S2" | "S3" | "S4"
  rank: number | null;
};

// ---------- LIVE S5 SEARCH ----------
async function searchUser(username: string, timeframe: string): Promise<TFResult> {
  const u = username.toLowerCase();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      `${LEADERBOARD_BASE}?timeframe=${encodeURIComponent(timeframe)}` +
      `&sortBy=mindshare&page=${page}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;

    const json = await res.json();
    const list: LeaderRow[] = json.data || [];

    if (!list.length) break;

    for (const row of list) {
      const name = (row.username || row.displayName || "")
        .toString()
        .toLowerCase();

      if (name === u) {
        return {
          timeframe,
          page,
          rank: row.rank ?? row.position ?? null,
          username: row.username,
          displayName: row.displayName,
          mindshare: row.mindshare,
        };
      }
    }
  }

  return { timeframe, found: false };
}

// ---------- S1–S4 HISTORY LOOKUP ----------
function getSeasonHistory(username: string): HistorySeason[] {
  const clean = username.toLowerCase().replace("@", "");

  const SEASONS = ["S1", "S2", "S3", "S4"];

  return SEASONS.map((s) => {
    const rows = (seasons as any)[s] || [];

    const match = rows.find(
      (r: any) =>
        r.handle?.toLowerCase() === clean ||
        r.username?.toLowerCase() === clean
    );

    return {
      season: s,
      rank: match ? match.rank : null,
    };
  });
}

// ---------- MAIN ROUTE ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username required" },
      { status: 400 }
    );
  }

  const clean = username.trim().replace(/^@/, "");

  try {
    const [tfResults, history] = await Promise.all([
      Promise.all(TIMEFRAMES.map((tf) => searchUser(clean, tf))),
      Promise.resolve(getSeasonHistory(clean)), // no API request
    ]);

    const body: any = { username: clean };

    for (const r of tfResults) {
      body[r.timeframe] = r;
    }

    body.history = history;

    return NextResponse.json(body);
  } catch (err) {
    console.error("find-rank error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
