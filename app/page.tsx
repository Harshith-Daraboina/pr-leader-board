"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Leaderboard from "@/components/Leaderboard";

interface Contributor {
  username: string;
  count: number;
  prs: any[];
  avatar: string;
  score: number;
  rank: number;
}

interface Repository {
  full_name: string;
  name: string;
  owner: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [sinceTime, setSinceTime] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [leaderboard, setLeaderboard] = useState<Contributor[]>([]);
  const [totalPRs, setTotalPRs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-set owner to logged-in user and fetch repositories
  useEffect(() => {
    if (session?.username) {
      setOwner(session.username);
    }
  }, [session?.username]);

  const fetchRepositories = useCallback(async () => {
    if (!session) {
      console.log("No session available for fetching repositories");
      return;
    }

    console.log("Fetching repositories...");
    setLoadingRepos(true);
    setRepoError("");
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();

      console.log("Repository API response:", { status: response.status, data });

      if (response.ok) {
        const repos = data.repositories || [];
        console.log(`Found ${repos.length} repositories`);
        setRepositories(repos);
        if (repos.length === 0) {
          setRepoError("No repositories found. Make sure you have repositories in your GitHub account.");
        }
      } else {
        const errorMsg = data.error || "Failed to load repositories";
        console.error("Repository API error:", errorMsg);
        setRepoError(errorMsg);
      }
    } catch (err: any) {
      console.error("Failed to fetch repositories:", err);
      setRepoError(`Failed to fetch repositories: ${err.message}. Please try again.`);
    } finally {
      setLoadingRepos(false);
    }
  }, [session]);

  // Fetch repositories when session is available
  useEffect(() => {
    console.log("Session check:", { hasSession: !!session, username: session?.username });
    if (session?.username) {
      console.log("Fetching repositories for user:", session.username);
      fetchRepositories();
    } else {
      console.log("Session or username not available yet");
    }
  }, [session?.username, fetchRepositories]);

  // Handle repository selection
  const handleRepoChange = (fullName: string) => {
    if (!fullName) return;
    const [repoOwner, repoName] = fullName.split("/");
    if (repoOwner && repoName) {
      setOwner(repoOwner);
      setRepo(repoName);
      setError(""); // Clear any previous errors
    }
  };

  // Convert from HTML5 date format (yyyy-mm-dd) to display format (dd-mm-yyyy)
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  // Convert from display format (dd-mm-yyyy) to HTML5 date format (yyyy-mm-dd)
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  // Format date and time for API (ISO 8601 format)
  const formatDateTimeForAPI = (dateStr: string, timeStr: string): string => {
    if (!dateStr) return "";
    // dateStr is in yyyy-mm-dd format from HTML5 date input
    const datePart = dateStr;
    
    if (timeStr && timeStr.length === 5) {
      // timeStr is in HH:MM format
      return `${datePart}T${timeStr}:00.000Z`;
    }
    // Default to start of day if no time provided
    return `${datePart}T00:00:00.000Z`;
  };

  const fetchLeaderboard = useCallback(async () => {
    if (!owner || !repo) {
      setError("Please select a repository");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        owner,
        repo,
        ...(sinceDate && { since: formatDateTimeForAPI(sinceDate, sinceTime) }),
      });

      const response = await fetch(`/api/prs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pull requests");
      }

      setLeaderboard(data.leaderboard || []);
      setTotalPRs(data.totalPRs || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLeaderboard([]);
      setTotalPRs(0);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, sinceDate, sinceTime]);

  // Auto-refresh every minute if leaderboard is loaded
  useEffect(() => {
    if (!owner || !repo || leaderboard.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 60000); // 60 seconds = 1 minute

    return () => clearInterval(interval);
  }, [owner, repo, sinceDate, sinceTime, leaderboard.length, fetchLeaderboard]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              PR Leaderboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Sign in with GitHub to view pull request leaderboards
            </p>
          </div>
          <button
            onClick={() => signIn("github")}
            className="w-full rounded-lg bg-foreground px-4 py-3 font-semibold text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">PR Leaderboard</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              View contributor rankings by pull request count
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Signed in</p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Auto-refreshing every minute</span>
          </div>
        )}

        <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Repository
              </label>
              <div className="flex gap-2 items-start">
                <select
                  value={repo && owner ? `${owner}/${repo}` : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleRepoChange(e.target.value);
                    } else {
                      setRepo("");
                      setOwner(session?.username || "");
                    }
                  }}
                  disabled={loadingRepos || !session?.username}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                >
                  <option value="">
                    {loadingRepos ? "Loading repositories..." : repositories.length === 0 && !loadingRepos ? "No repositories available" : "Select a repository"}
                  </option>
                  {repositories.map((repository) => (
                    <option key={repository.full_name} value={repository.full_name}>
                      {repository.full_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchRepositories}
                  disabled={loadingRepos || !session?.username}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 shrink-0"
                  title="Refresh repositories"
                >
                  ↻
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {session?.username && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Repository owner: <span className="font-medium">{session.username}</span>
                  </p>
                )}
                {!loadingRepos && repositories.length > 0 && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {repositories.length} repository{repositories.length !== 1 ? "ies" : ""} found
                  </p>
                )}
              </div>
              {repoError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {repoError}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Since Date & Time (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sinceDate}
                    onChange={(e) => {
                      setSinceDate(e.target.value);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sinceTime}
                    onChange={(e) => {
                      setSinceTime(e.target.value);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Fetch Leaderboard"}
          </button>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <Leaderboard
          leaderboard={leaderboard}
          totalPRs={totalPRs}
          loading={loading}
        />
      </div>
    </div>
  );
}
