# PR Leaderboard

A Next.js application that authenticates with GitHub and displays a leaderboard of contributors ranked by pull request count.

## Features

- 🔐 GitHub OAuth authentication via NextAuth.js
- 📊 Pull request leaderboard sorted by contributor PR count
- 📅 Filter PRs by date (since a given date)
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time data fetching from GitHub REST API

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js with GitHub OAuth
- **Styling**: Tailwind CSS
- **API**: Next.js API Routes + GitHub REST API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A GitHub OAuth App (already configured)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

The `.env.local` file has already been created with your credentials.

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign in with your GitHub account
2. Enter the repository owner and name (e.g., `facebook` / `react`)
3. Optionally select a "Since Date" to filter PRs from that date onwards
4. Click "Fetch Leaderboard" to see the contributor rankings

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration
│   │   └── prs/route.ts                  # GitHub PR API endpoint
│   ├── layout.tsx                        # Root layout with SessionProvider
│   ├── page.tsx                          # Main leaderboard page
│   └── globals.css                       # Global styles
├── components/
│   ├── Leaderboard.tsx                   # Leaderboard display component
│   └── SessionProvider.tsx               # NextAuth session provider
└── types/
    └── next-auth.d.ts                    # NextAuth TypeScript types
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [GitHub REST API](https://docs.github.com/en/rest)
