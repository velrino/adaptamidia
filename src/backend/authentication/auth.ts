import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth";
import { API } from "../api/api.endpoints";
// import { IApiAuthLogin } from "./services/api/interfaces";

export type ApiSession = {
  id: string;
  access_token: string;
  expires_in: string;
  session: string;
  iat: number;
  exp: number;
} & DefaultSession["user"];

declare module "next-auth" {
  interface Session extends DefaultSession {
    api_session: ApiSession;
  }
}

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
      if (session.user) {
        session.api_session = token.user as ApiSession;
      }

      return session;
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Unexpected error validating credentials");
        }

        try {
          const response = await API.auth.login({
            email: credentials.email,
            password: credentials.password,
          });

          const data = await response.json();

          if (data.access_token) {
            return data;
          }

          throw data;
        } catch (e) {
          throw e;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production" ? true : false,
};

export const getServerAuthSession = () => getServerSession(nextAuthOptions);
