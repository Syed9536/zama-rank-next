// app/api/share-card/route.tsx
import React from "react";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

// 🔄 OG image edge runtime pe fast render hogi
export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "unknown";
  const rankParam = searchParams.get("rank");
  const rewardParam = searchParams.get("reward");

  const rank = rankParam ? `#${rankParam}` : "Not ranked";
  const reward =
    rewardParam && rewardParam !== "0"
      ? `~$${Number(rewardParam).toLocaleString()}`
      : "—";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at top, #22d3ee33 0, transparent 55%), radial-gradient(circle at bottom, #f9731633 0, transparent 55%), #020617",
          color: "#e5e7eb",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        {/* Top heading */}
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: 16,
          }}
        >
          Zama All Szn Rank
        </div>

        {/* Username */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          @{username || "unknown"}
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#9ca3af",
            marginBottom: 32,
          }}
        >
          Unofficial creator dashboard • zamarank.live
        </div>

        {/* Rank + Reward cards */}
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "center",
          }}
        >
          {/* Rank card */}
          <div
            style={{
              padding: "18px 24px",
              borderRadius: 20,
              border: "1px solid rgba(52,211,153,0.7)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(15,23,42,0.95))",
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#a7f3d0",
                marginBottom: 6,
              }}
            >
              Best rank this season
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#6ee7b7",
              }}
            >
              {rank}
            </div>
          </div>

          {/* Reward card */}
          <div
            style={{
              padding: "18px 24px",
              borderRadius: 20,
              border: "1px solid rgba(251,191,36,0.8)",
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(15,23,42,0.95))",
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#facc15",
                marginBottom: 6,
              }}
            >
              Speculative reward
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#fde68a",
              }}
            >
              {reward}
            </div>
          </div>
        </div>

        {/* Footer line */}
        <div
          style={{
            marginTop: 40,
            fontSize: 16,
            color: "#9ca3af",
          }}
        >
          Check your full history at{" "}
          <span style={{ color: "#fbbf24" }}>zamarank.live</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
