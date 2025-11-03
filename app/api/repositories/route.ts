import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const repositories: any[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    // Fetch all repositories for the authenticated user
    while (hasMore) {
      const url = `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`;
      
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

      repositories.push(...data);

      // If we got less than perPage results, we've reached the end
      if (data.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Format repositories as {full_name, name} for easier use
    const formattedRepos = repositories.map((repo: any) => ({
      full_name: repo.full_name,
      name: repo.name,
      owner: repo.owner.login,
    }));

    return NextResponse.json({
      repositories: formattedRepos,
    });
  } catch (error: any) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

