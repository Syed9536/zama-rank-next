// app/share/[handle]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";

type SharePageProps = {
  params: { handle: string };
  searchParams: {
    rank?: string;
    reward?: string;
  };
};

// ✅ OG + Twitter card metadata
export async function generateMetadata(
  { params, searchParams }: SharePageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const handle = params.handle;
  const rank = searchParams.rank || "";
  const reward = searchParams.reward || "";

  // 👇 apna actual prod domain daal dena
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://zama-rank-next.vercel.app";

  const ogImageUrl =
    `${baseUrl}/api/share-card` +
    `?username=${encodeURIComponent(handle)}` +
    (rank ? `&rank=${encodeURIComponent(rank)}` : "") +
    (reward ? `&reward=${encodeURIComponent(reward)}` : "");

  const pageUrl =
    `${baseUrl}/share/${encodeURIComponent(handle)}` +
    (rank || reward
      ? `?${new URLSearchParams({
          ...(rank ? { rank } : {}),
          ...(reward ? { reward } : {}),
        }).toString()}`
      : "");

  const title = rank
    ? `Zama Rank — @${handle} #${rank}`
    : `Zama Rank — @${handle}`;

  const description =
    "Unofficial Zama All SZN Rank dashboard. Check your placement & speculative rewards.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Zama Rank card for @${handle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// Simple page (user kabhi direct open kare to blank na lage)
export default function SharePage({ params, searchParams }: SharePageProps) {
  const { handle } = params;
  const rank = searchParams.rank;
  const reward = searchParams.reward;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="max-w-md text-center space-y-3 px-4">
        <h1 className="text-lg font-semibold">
          Zama All SZN Rank — Share Card
        </h1>
        <p className="text-sm text-slate-300">
          This page is used as a share preview for{" "}
          <span className="font-mono">@{handle}</span>.
        </p>
        {rank && (
          <p className="text-sm">
            <span className="text-slate-400">Best rank:</span>{" "}
            <span className="font-semibold">#{rank}</span>
          </p>
        )}
        {reward && (
          <p className="text-sm">
            <span className="text-slate-400">Speculative reward:</span>{" "}
            <span className="font-semibold">${reward}</span>
          </p>
        )}
        <p className="text-xs text-slate-500">
          Open this link on X to see the full preview card.
        </p>
      </div>
    </main>
  );
}
