"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import Image from "next/image";
// Imports for Confetti and Window Size
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import {
  Twitter,
  Link2,
  X,
  TwitterIcon,
  XIcon,
  XCircleIcon,
  BarChart3,
  History,
  Zap,
  Shield,
  Activity,
  Globe,
  Share2, // 👈 Share button icon
} from "lucide-react";

type TFResult = {
  timeframe: string;
  page?: number;
  rank?: number | null;
  username?: string;
  displayName?: string;
  mindshare?: number;
  found?: boolean;
};

type HistoryItem = {
  season: string;
  rank: number | null;
};

type ApiData = {
  username: string;
  "24h"?: TFResult;
  "7d"?: TFResult;
  "30d"?: TFResult;
  history?: HistoryItem[];
  error?: string;
};

// ---- Prize Pool (speculative) ----
// Fixed pool per season: $53,000 — split across Top 100
const PRIZE_POOL = 53000;

type PrizeBracket = {
  min: number;
  max: number;
  amount: number; // USDT per rank inside this range
};

// Brackets ka sum ≈ $53,000 (exactly 53k with these values)
const PRIZE_BRACKETS: PrizeBracket[] = [
  { min: 1, max: 1, amount: 4000 }, // #1
  { min: 2, max: 5, amount: 2600 }, // #2–5
  { min: 6, max: 10, amount: 1700 }, // #6–10
  { min: 11, max: 25, amount: 900 }, // #11–25
  { min: 26, max: 50, amount: 450 }, // #26–50
  { min: 51, max: 75, amount: 200 }, // #51–75
  { min: 76, max: 100, amount: 14 }, // #76–100 (small but keeps pool = 53k)
];

// Given a rank, return USDT reward or null if not in Top 100
function getPrizeForRank(rank?: number | null): number | null {
  if (!rank || rank < 1 || rank > 100) return null;
  const bracket = PRIZE_BRACKETS.find(
    (b) => rank >= b.min && rank <= b.max,
  );
  return bracket ? bracket.amount : null;
}

// --- HELPER FOR BUTTON BURST PARTICLES ---
const generateBurstParticles = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 50 + Math.random() * 60;
    const tx = Math.cos((angle * Math.PI) / 180) * distance;
    const ty = Math.sin((angle * Math.PI) / 180) * distance;
    const rot = Math.random() * 720 - 360;
    const delay = Math.random() * 0.15;
    const size = 0.8 + Math.random() * 0.6;
    return { id: i, tx, ty, rot, delay, size };
  });
};

const burstParticlesData = generateBurstParticles(12);

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<ApiData | null>(null);

  // === CONFETTI STATES ===
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true); // Control flow
  const { width, height } = useWindowSize();

  // Button Burst State
  const [isButtonBursting, setIsButtonBursting] = useState(false);

  // 🔊 WIN SOUND
  const winSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    winSound.current = new Audio("/winner.wav"); // public/winner.wav
  }, []);

  const handleCheck = async () => {
    // Button Burst
    setIsButtonBursting(true);
    setTimeout(() => {
      setIsButtonBursting(false);
    }, 800);

    const trimmed = username.trim();
    if (!trimmed) {
      setStatus("Enter Your X Username First.");
      return;
    }

    setLoading(true);
    setStatus("Calculating rank from global leaderboard…");
    setData(null);

    // Reset Confetti instantly for new search
    setShowConfetti(false);
    setRecycleConfetti(true);

    try {
      const res = await fetch(
        `/api/find-rank?username=${encodeURIComponent(
          trimmed.replace(/^@/, ""),
        )}`,
      );
      const json: ApiData = await res.json();

      if (!res.ok) {
        setStatus((json as any).error || "API error");
      } else {
        setStatus("Found ✔");
        setData(json);

        // ✅ Check: kisi bhi timeframe ya history me rank mila?
        const hasRankS5 =
          (json["24h"] && json["24h"]!.rank != null) ||
          (json["7d"] && json["7d"]!.rank != null) ||
          (json["30d"] && json["30d"]!.rank != null);

        const hasRankHistory =
          Array.isArray(json.history) &&
          json.history.some((h) => h.rank != null);

        const hasAnyRank = hasRankS5 || hasRankHistory;

        if (hasAnyRank) {
          // 🔊 sound play
          if (winSound.current) {
            winSound.current.currentTime = 0;
            winSound.current.play().catch(() => {});
          }

          // 🎉 Confetti trigger
          setShowConfetti(true);
          setRecycleConfetti(true);

          setTimeout(() => {
            setRecycleConfetti(false);
          }, 4000);

          setTimeout(() => {
            setShowConfetti(false);
          }, 10000);
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  };

  const label =
    (data?.["30d"]?.displayName ||
      data?.["7d"]?.displayName ||
      data?.["24h"]?.displayName ||
      data?.username) ?? username;

  const normalizedUsername = (data?.username || "").replace(/^@/, "");
  const history = data?.history ?? [];

  // --- Prize calculations ---

  // S1–S4: jitne seasons me Top 100, unka total & breakdown
  const topHistorySeasons = history.filter(
    (h) => h.rank != null && h.rank > 0 && h.rank <= 100,
  );

  const historyPrizeBreakdown = topHistorySeasons.map((h) => ({
    season: h.season,
    rank: h.rank!,
    prize: getPrizeForRank(h.rank)!,
  }));

  const totalHistoricalPrize = historyPrizeBreakdown.reduce(
    (sum, row) => sum + (row.prize || 0),
    0,
  );

  // LIVE SZN 5 (24h / 7d / 30d) — best current rank
  const liveRanks: number[] = [];

  (["24h", "7d", "30d"] as const).forEach((tf) => {
    const r = data?.[tf]?.rank;
    if (r != null && r > 0 && r <= 100) {
      liveRanks.push(r);
    }
  });

  const bestLiveRank =
    liveRanks.length > 0 ? Math.min(...liveRanks) : null;

  const potentialSeason5Prize = bestLiveRank
    ? getPrizeForRank(bestLiveRank)
    : null;

  // ✅ Share button sirf tab dikhana jab kisi timeframe me rank mila ho
  const hasAnyRankToShare = Boolean(
    (data?.["24h"]?.rank && data["24h"]!.rank! > 0) ||
      (data?.["7d"]?.rank && data["7d"]!.rank! > 0) ||
      (data?.["30d"]?.rank && data["30d"]!.rank! > 0),
  );

  // ✅ Simple Share-on-X: text + promo + website link
  const handleShare = () => {
    if (!data || !hasAnyRankToShare) return;

    const r24 = data["24h"]?.rank ?? null;
    const r7 = data["7d"]?.rank ?? null;
    const r30 = data["30d"]?.rank ?? null;

    const ranks = [r24, r7, r30].filter(
      (r) => typeof r === "number" && r > 0,
    ) as number[];

    const best = ranks.length ? Math.min(...ranks) : null;

    const handle =
      (data.username || username || "").replace(/^@/, "") || "unknown";

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    const siteUrl = baseUrl; // tumhari main website link

    const lines = [
      "🚀 Zama All SZN Rank (Unofficial)",
      `Handle: @${handle}`,
      best ? `Best rank this season: #${best}` : undefined,
      "",
      "Check your Zama creator rank 👇",
      "",
      "Built by @0xSyeds – unofficial dashboard for the Zama Creator Program.",
    ].filter(Boolean) as string[];

    const text = lines.join("\n");

    const shareUrl = new URL("https://x.com/intent/post");
    shareUrl.searchParams.set("text", text);
    // Link tweet ke end me attach hoga
    shareUrl.searchParams.set("url", siteUrl);

    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <main className="relative min-h-screen bg-[#020617] text-slate-50 overflow-hidden">
      {/* Inject CSS for button burst animation */}
      <style>{`
        @keyframes emoji-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(var(--size)) rotate(var(--rot)); }
        }
      `}</style>

      {/* Winning Confetti Animation (Smooth End) */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={recycleConfetti} // Controlled here
          numberOfPieces={400}
          gravity={0.2}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
        />
      )}

      {/* background cyber grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee33,_transparent_60%),radial-gradient(circle_at_bottom,_#f9731633,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* top bar with branding */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-10">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
          <Image
            src="/zama-logo.png"
            alt="Zama Logo"
            width={24}
            height={24}
            className="h-5 w-5"
          />

          <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs text-slate-400">
            Zama Creator Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* X handle */}
          <a
            href="https://x.com/0xSyeds"
            target="_blank"
            rel="noreferrer"
            className="
    inline-flex items-center gap-1 rounded-full
    px-3 py-1 text-xs font-medium
    border border-[#ff2cdf]/60
    bg-[#ff2cdf]/15
    shadow-[0_0_18px_rgba(255,44,223,0.65)]
    backdrop-blur-xl
    text-[#ffbdf7]
    transition-all duration-300
    hover:shadow-[0_0_30px_rgba(255,44,223,1)]
    hover:border-[#ff2cdf]
    hover:text-white
  "
          >
            <Image
              src="/x-logo.svg"
              alt="X Logo"
              width={14}
              height={14}
              className="opacity-90"
            />
            <span>@0xSyeds</span>
          </a>

          {/* Zama Official */}
          <a
            href="https://www.zama.org/programs/creator-program"
            target="_blank"
            rel="noreferrer"
            className="
    inline-flex items-center gap-1 rounded-full
    px-3 py-1 text-[11px] font-medium
    border border-[#fdfd96]/60
    bg-[#fdfd96]/15
    shadow-[0_0_18px_rgba(253,253,150,0.65)]
    backdrop-blur-xl
    text-[#fffbe0]
    transition-all duration-300
    hover:shadow-[0_0_30px_rgba(253,253,150,1)]
    hover:border-[#fdfd96]
    hover:text-white
  "
          >
            <Image
              src="/zama-logo.png"
              alt="Zama Logo"
              width={14}
              height={14}
              className="opacity-90"
            />
            <span>Zama Official Lb</span>
          </a>
        </div>
      </header>

      {/* FOLLOW ME CYBERPUNK BANNER */}
      <div className="relative z-10 mt-4 mb-6 flex justify-center">
        <a
          href="https://x.com/0xSyeds"
          target="_blank"
          rel="noreferrer"
          className="
            follow-banner group relative px-6 py-3 rounded-2xl
            bg-gradient-to-r from-[#0ea5e9]/20 via-[#8b5cf6]/20 to-[#f59e0b]/20
            border border-slate-700/70
            shadow-[0_0_30px_rgba(56,189,248,0.25)]
            backdrop-blur-xl
            flex items-center gap-3
            transition-all duration-300
            hover:shadow-[0_0_45px_rgba(251,191,36,0.45)]
            hover:border-amber-400/60
            hover:-translate-y-1
          "
        >
          {/* Bird */}
          <span className="bird-area">
            <div className="bird-wrapper-path">
              <img
                src="/bird.png"
                alt="Flying bird"
                className="bird-icon-css"
              />
            </div>
          </span>

          {/* Content */}
          <span className="relative text-sm font-medium tracking-wide flex items-center gap-2">
            <Image
              src="/zama-logo.png"
              alt="Logo"
              width={20}
              height={20}
              className="opacity-70 group-hover:opacity-100 transition"
            />
            Built by{" "}
            <span className="text-amber-300 font-semibold">@0xSyeds</span>
            <span className="text-cyan-300 font-semibold group-hover:text-amber-300 transition">
              • Follow on X
            </span>
          </span>
        </a>
      </div>

      {/* main card container */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-16 pt-6 md:pt-10">
        <div className="w-full max-w-4xl">
          {/* Main Search Card */}
          <div className="relative rounded-[32px] border border-slate-800/80 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 px-5 py-6 shadow-[0_0_60px_rgba(15,23,42,0.9)] overflow-hidden">
            {/* neon border glow */}
            <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-amber-400/10 shadow-[0_0_45px_rgba(251,191,36,0.25)]" />

            <div className="relative space-y-5">
              {/* title */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
                    ZAMA ALL SZN RANK
                  </span>{" "}
                  <span className="text-slate-500 text-sm align-middle ml-1">
                    (Unofficial)
                  </span>
                </h1>
              </div>

              {/* search bar + 3D pill button */}
              <div className="flex flex-col sm:flex-row gap-3 mb-1">
                <div className="flex-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-4 py-2.5 flex items-center gap-3 shadow-[0_18px_40px_rgba(15,23,42,0.9)_inset]">
                  {/* LABEL */}
                  <span className="hidden md:inline-flex items-center gap-2 select-none">
                    <Image
                      src="/x-logo.svg"
                      alt="X"
                      width={11}
                      height={11}
                      className="opacity-50"
                    />
                    <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 font-medium">
                      HANDLE
                    </span>
                  </span>

                  <input
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600"
                    placeholder="@0xSyeds"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  />
                </div>

                {/* SEARCH BUTTON */}
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  className="
                    group relative overflow-hidden rounded-full
                    bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300
                    bg-[length:200%_auto]
                    px-12 py-3.5
                    font-bold text-slate-950 text-sm tracking-[0.1em] uppercase
                    shadow-[0_0_20px_rgba(251,191,36,0.5)]
                    border border-amber-200/50
                    transition-all duration-500 ease-out
                    hover:bg-right hover:scale-105 hover:shadow-[0_0_50px_rgba(251,191,36,0.8),inset_0_0_10px_rgba(255,255,255,0.5)]
                    active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {/* SHINE EFFECT */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />

                  {/* EMOJI BURST */}
                  {isButtonBursting && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
                      {burstParticlesData.map((p) => (
                        <span
                          key={p.id}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[emoji-burst_0.8s_ease-out_forwards] select-none"
                          style={
                            {
                              "--tx": `${p.tx}px`,
                              "--ty": `${p.ty}px`,
                              "--rot": `${p.rot}deg`,
                              "--size": p.size,
                              animationDelay: `${p.delay}s`,
                              fontSize: "20px",
                            } as React.CSSProperties
                          }
                        >
                          🔍
                        </span>
                      ))}
                    </div>
                  )}

                  {/* BUTTON TEXT */}
                  <span className="relative z-20 flex items-center gap-2">
                    {loading ? (
                      <>
                        <span className="animate-spin text-lg">⟳</span>{" "}
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        SEARCH
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {status && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {status}
                </p>
              )}

              {/* results */}
              {data && (
                <div className="mt-2 space-y-4">
                  {/* username header */}
                  <div className="border border-slate-800 rounded-2xl bg-slate-900/80 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
                        Username
                      </div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        {label || username}
                        {normalizedUsername && hasAnyRankToShare && (
                          <button
                            type="button"
                            onClick={handleShare}
                            className="
      inline-flex items-center gap-1 rounded-full
      px-2.5 py-0.5 text-[11px] font-medium
      border border-sky-500/60 bg-sky-500/10
      text-sky-300
      hover:bg-sky-500/20 hover:border-sky-400 hover:text-white
      transition-all
    "
                          >
                            <Share2 className="w-3 h-3" />
                            Share on X
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      Calculated from Zama's leaderboard
                    </div>
                  </div>

                  {/* Rewards simulation (USDT) */}
                  {(historyPrizeBreakdown.length > 0 ||
                    potentialSeason5Prize) && (
                    <div className="border border-emerald-500/40 rounded-2xl bg-emerald-500/5 px-4 py-4 text-sm shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">
                            Rewards (speculative)
                          </div>
                          <div className="text-xs text-slate-400">
                            Prize pool per season assumed:{" "}
                            <span className="text-emerald-300 font-semibold">
                              ${PRIZE_POOL.toLocaleString()}
                            </span>{" "}
                            split across Top 100.
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {/* Historical Rewards (S1–S4) */}
                        <div className="rounded-xl border border-emerald-400/30 bg-slate-950/60 px-3 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                              S1–S4 Earned
                            </span>
                            {totalHistoricalPrize > 0 && (
                              <span className="text-xs text-emerald-300 font-semibold">
                                ~${totalHistoricalPrize.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {historyPrizeBreakdown.length === 0 ? (
                            <p className="text-[11px] text-slate-500">
                              Not in Top 100 for Seasons 1–4.
                            </p>
                          ) : (
                            <div className="space-y-1.5 text-[11px] text-slate-300">
                              {historyPrizeBreakdown.map((row) => (
                                <div
                                  key={row.season}
                                  className="flex items-center justify-between"
                                >
                                  <span>
                                    {row.season} —{" "}
                                    <span className="text-slate-400">
                                      Rank
                                    </span>{" "}
                                    <span className="font-semibold">
                                      #{row.rank}
                                    </span>
                                  </span>
                                  <span className="text-emerald-300 font-medium">
                                    ~${row.prize.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Season 5 Potential Reward */}
                        <div className="rounded-xl border border-amber-400/40 bg-slate-950/70 px-3 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                              SZN 5 Potential
                            </span>
                          </div>

                          {bestLiveRank && potentialSeason5Prize ? (
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-slate-300">
                                Best current rank:{" "}
                                <span className="font-semibold text-amber-300">
                                  #{bestLiveRank}
                                </span>{" "}
                                in the live leaderboard.
                              </p>
                              <p className="text-[11px] text-slate-400">
                                If final rewards follow this split, your
                                estimated SZN 5 share could be:
                              </p>
                              <div className="mt-1 text-lg font-semibold text-amber-300">
                                ~${potentialSeason5Prize.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500">
                              Not in Top 100 in current 24h / 7d / 30d
                              snapshots.
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] text-slate-500">
                        Disclaimer: This is a{" "}
                        <span className="text-amber-300">speculative</span>{" "}
                        reward model inspired by zamarank.live. Actual rewards
                        are decided by Zama / official programs.
                      </p>
                    </div>
                  )}

                  {/* timeframe cards */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <TimeframeCard label="24 Hours" data={data["24h"]} />
                    <TimeframeCard label="7 Days" data={data["7d"]} />
                    <TimeframeCard
                      label="30 Days"
                      data={data["30d"]}
                      highlight
                    />
                  </div>

                  {/* historical seasons */}
                  {history.length > 0 && (
                    <div className="border border-slate-800 rounded-2xl bg-slate-900/80 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-400">
                          Historical Seasons (rank only)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Archived from S1–S4 winners
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {["S1", "S2", "S3", "S4"].map((season) => {
                          const row = history.find(
                            (h) => h.season.toUpperCase() === season,
                          );
                          const value =
                            row && row.rank != null
                              ? `#${row.rank}`
                              : "Not ranked";

                          return (
                            <div
                              key={season}
                              className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2 flex flex-col gap-1 shadow-[0_0_20px_rgba(15,23,42,0.9)]"
                            >
                              <span className="text-[10px] text-slate-500">
                                {season}
                              </span>
                              <span className="font-semibold text-sm">
                                {value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* debug JSON */}
                  <details className="text-xs mt-1">
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-300 mb-1">
                      Raw JSON (debug)
                    </summary>
                    <pre className="whitespace-pre-wrap break-all max-h-64 overflow-auto bg-slate-950/90 rounded-xl border border-slate-800 p-3 text-[11px]">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {!data && (
                <p className="text-[11px] text-slate-500 mt-3 text-center">
                  Type your X username and hit{" "}
                  <span className="text-amber-300 font-semibold">Search</span>{" "}
                  to see 24h, 7d &amp; 30d ranks + S1–S4 history.
                </p>
              )}
            </div>
          </div>

          {/* FEATURES GRID */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/60 hover:border-slate-700 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Real-time Mindshare
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  Live tracking of Zama's All Seasons Rank And Mindshare of Live
                  Season.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/60 hover:border-slate-700 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Historical Archiving
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  Access archived data from Seasons 1–4. Compare your growth
                  trajectory over time.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/60 hover:border-slate-700 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-200">
                  Privacy First
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  Built on secure protocols. We do not store your personal
                  search queries or wallet data.
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-12 border-t border-slate-800/50 pt-8 pb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Status Indicators */}
              <div className="flex items-center gap-6 text-[10px] uppercase tracking-wider font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  System Online
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Global Search
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber-400" />
                  v2.0.4 (Fast)
                </div>
              </div>

              {/* Footer Credit */}
              <div className="text-[10px] text-slate-600">
                Built by{" "}
                <a
                  href="https://x.com/0xSyeds"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-amber-300 transition-colors"
                >
                  @0xSyeds
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TimeframeCard({
  label,
  data,
  highlight,
}: {
  label: string;
  data?: TFResult;
  highlight?: boolean;
}) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm shadow-[0_0_20px_rgba(15,23,42,0.9)]">
        <div className="text-xs text-slate-400 mb-1">{label}</div>
        <div className="text-xs text-slate-500">No data</div>
      </div>
    );
  }

  const notFound = (data as any).found === false;

  const rankText =
    data.rank != null
      ? `#${data.rank}`
      : notFound
      ? "Not in range"
      : "Searching…";

  const ms =
    typeof data.mindshare === "number" ? data.mindshare.toFixed(6) : "-";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_0_26px_rgba(15,23,42,0.9)] ${
        highlight
          ? "border-emerald-400/70 bg-gradient-to-br from-emerald-500/15 via-slate-950/90 to-emerald-400/10"
          : "border-slate-800 bg-slate-950/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        {data.page && (
          <span className="text-[10px] text-slate-500">page {data.page}</span>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] text-slate-400">Rank</div>
          <div className="text-xl font-bold">{rankText}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400">Mindshare</div>
          <div className="text-sm font-medium">{ms}</div>
        </div>
      </div>
    </div>
  );
}
