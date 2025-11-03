import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const since = searchParams.get("since"); // ISO date string

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo parameters" },
        { status: 400 }
      );
    }

    const prs = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      let url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=${perPage}&page=${page}&sort=created&direction=desc`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `GitHub API error: ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      if (data.length === 0) {
        hasMore = false;
        break;
      }

      // Filter PRs by date if since parameter is provided
      if (since) {
        const sinceDate = new Date(since);
        const filtered = data.filter((pr: any) => {
          const prDate = new Date(pr.created_at);
          return prDate >= sinceDate;
        });

        prs.push(...filtered);

        // If the last PR is before the since date, we can stop fetching
        if (filtered.length < data.length) {
          hasMore = false;
        }
      } else {
        prs.push(...data);
      }

      // If we got less than perPage results, we've reached the end
      if (data.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Group PRs by contributor
    const contributors: Record<string, { count: number; prs: any[] }> = {};

    for (const pr of prs) {
      const username = pr.user?.login;
      if (username) {
        if (!contributors[username]) {
          contributors[username] = {
            count: 0,
            prs: [],
          };
        }
        contributors[username].count++;
        contributors[username].prs.push({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          created_at: pr.created_at,
          merged_at: pr.merged_at,
          url: pr.html_url,
        });
      }
    }

    // Convert to array and sort by count
    const leaderboard = Object.entries(contributors)
      .map(([username, data]) => ({
        username,
        count: data.count,
        prs: data.prs,
        avatar: prs.find((pr: any) => pr.user?.login === username)?.user?.avatar_url || "",
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate scores: 1st place gets 100, others get reduced score based on rank and total members
    const totalMembers = leaderboard.length;
    const leaderboardWithScores = leaderboard.map((contributor, index) => {
      const rank = index + 1;
      let score: number;
      
      if (rank === 1) {
        score = 100;
      } else {
        // Calculate score reduction: 100 / totalMembers points deducted per rank
        // Formula: 100 * (totalMembers - rank + 1) / totalMembers
        score = Math.round((100 * (totalMembers - rank + 1)) / totalMembers);
      }
      
      return {
        ...contributor,
        score,
        rank,
      };
    });

    return NextResponse.json({
      leaderboard: leaderboardWithScores,
      totalPRs: prs.length,
      totalMembers,
      since: since || null,
    });
  } catch (error: any) {
    console.error("Error fetching PRs:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

