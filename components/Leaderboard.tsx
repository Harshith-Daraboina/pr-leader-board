"use client";

import Image from "next/image";

interface PR {
  number: number;
  title: string;
  state: string;
  created_at: string;
  merged_at: string | null;
  url: string;
}

interface Contributor {
  username: string;
  count: number;
  prs: PR[];
  avatar: string;
  score: number;
  rank: number;
}

interface LeaderboardProps {
  leaderboard: Contributor[];
  totalPRs: number;
  loading?: boolean;
}

export default function Leaderboard({ leaderboard, totalPRs, loading }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">No pull requests found</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Total Pull Requests: <span className="font-semibold text-foreground">{totalPRs}</span>
        </p>
      </div>
      <div className="space-y-4">
        {leaderboard.map((contributor, index) => (
          <div
            key={contributor.username}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                {contributor.avatar ? (
                  <Image
                    src={contributor.avatar}
                    alt={contributor.username}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-xl font-semibold">
                    {contributor.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {contributor.username}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {contributor.count} pull request{contributor.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {contributor.score}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">points</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 text-sm font-semibold">
                  #{contributor.rank}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

