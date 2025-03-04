import { nextAuthOptions } from "@/backend/authentication/auth";
import NextAuth from "next-auth";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
