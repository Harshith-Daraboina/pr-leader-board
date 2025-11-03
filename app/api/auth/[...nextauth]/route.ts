import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        
        // Fetch GitHub username from API
        if (!token.username && account.access_token) {
          try {
            const response = await fetch("https://api.github.com/user", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            if (response.ok) {
              const githubUser = await response.json();
              token.username = githubUser.login;
            }
          } catch (error) {
            console.error("Failed to fetch GitHub username:", error);
          }
        }
      }
      // Fallback to user object if API call failed
      if (user && !token.username) {
        token.username = (user as any).login || user.name || user.email?.split("@")[0];
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.username = token.username as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

