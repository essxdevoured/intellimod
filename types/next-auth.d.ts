import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      plan?: string | null;
      secretKey?: string | null;
    };
  }

  interface User {
    username?: string | null;
    plan: string;
    secretKey?: string | null;
    robloxId: string;
  }
}
