import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getClientIp,
  getRateLimitState,
  logLoginAttempt,
} from "@/lib/auth-rate-limit";

type UserRole = "USER" | "ADMIN";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const ip = getClientIp(request);

        const limitState = await getRateLimitState({ email, ip });
        if (limitState.blocked) {
          await logLoginAttempt({
            email,
            ip,
            success: false,
            blocked: true,
            reason: `rate_limited_${limitState.retryAfterSeconds}s`,
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          await logLoginAttempt({
            email,
            ip,
            success: false,
            reason: "invalid_credentials",
          });
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) {
          await logLoginAttempt({
            email,
            ip,
            success: false,
            reason: "invalid_credentials",
          });
          return null;
        }

        await logLoginAttempt({
          email,
          ip,
          success: true,
          reason: "ok",
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
