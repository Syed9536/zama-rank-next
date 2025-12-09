import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const username = searchParams.get("username") || "Unknown";
  const rank = searchParams.get("rank") || "N/A";
  const reward = searchParams.get("reward") || "0";
  const top = searchParams.get("top") || "—";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px",
          background: "linear-gradient(135deg, #020617, #1e293b)",
          color: "white",
          fontFamily: "sans-serif",
          border: "20px solid #fbbf24",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
           <h1 style={{ fontSize: 60, fontWeight: 900, background: "linear-gradient(90deg,#fbbf24,#f472b6,#38bdf8)", backgroundClip: "text", color: "transparent", margin: 0 }}>
             Zama Rank
           </h1>
        </div>

        <div style={{ fontSize: 40, color: "#94a3b8" }}>@{username}</div>

        <div style={{ display: "flex", gap: "40px", marginTop: "40px" }}>
           <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, color: "#64748b", textTransform: "uppercase", letterSpacing: "2px" }}>Rank</span>
              <span style={{ fontSize: 80, fontWeight: 900, color: "#fbbf24" }}>#{rank}</span>
           </div>
           
           {reward !== "0" && (
             <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 24, color: "#64748b", textTransform: "uppercase", letterSpacing: "2px" }}>Reward</span>
                <span style={{ fontSize: 80, fontWeight: 900, color: "#34d399" }}>${reward}</span>
             </div>
           )}
        </div>

        <div style={{ position: "absolute", bottom: "40px", right: "40px", fontSize: 20, color: "#475569" }}>
           Check yours at zamarank.live
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}