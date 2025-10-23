import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { prisma } from "@/lib/prisma";

interface RobloxProfile {
  sub: string;
  name?: string;
  preferred_username?: string;
  nickname?: string;
  picture?: string;
}

const robloxProvider: OAuthConfig<RobloxProfile> = {
  id: "roblox",
  name: "Roblox",
  type: "oauth",
  authorization: {
    url: "https://apis.roblox.com/oauth/v1/authorize",
    params: {
      scope: "openid profile",
      response_type: "code",
    },
  },
  token: "https://apis.roblox.com/oauth/v1/token",
  userinfo: "https://apis.roblox.com/oauth/v1/userinfo",
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name ?? profile.preferred_username ?? profile.nickname ?? "Roblox Creator",
      email: null,
      image: profile.picture,
      username: profile.preferred_username ?? profile.nickname ?? profile.name ?? undefined,
    };
  },
  clientId: process.env.ROBLOX_CLIENT_ID,
  clientSecret: process.env.ROBLOX_CLIENT_SECRET,
  checks: ["pkce", "state"],
  idToken: true,
  wellKnown: undefined,
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [robloxProvider],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.plan = user.plan;
        session.user.secretKey = user.secretKey ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!account?.providerAccountId) {
        return false;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          robloxId: account.providerAccountId,
          username: user.username ?? user.name ?? undefined,
        },
      });
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
};
