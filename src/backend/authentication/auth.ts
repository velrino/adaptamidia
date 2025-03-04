import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth";
// import { IApiAuthLogin } from "./services/api/interfaces";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User;
  }
}

export type User = {
  id: string;
} & DefaultSession["user"];

export const nextAuthOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }

      return token;
    },
    async session({ session, token }) {
      return { ...session, user: { ...session.user, id: token.sub } };
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.debug({ credentials });
        // if (!credentials?.email || !credentials?.password) {
        //   throw new Error("Unexpected error validating credentials");
        // }

        return {
          access_token:
            "REDACTED",
          expires_in: "2025-02-20T21:38:11.000-03:00",
          session: "677ffe3e536ad13a8572fbe3-191.183.41.16-1739493491213",
          id: "677ffe3e536ad13a8572fbe3",
          iat: 1739493491,
          exp: 1740098291,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production" ? true : false,
};

export const getServerAuthSession = () => getServerSession(nextAuthOptions);
