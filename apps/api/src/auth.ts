import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "./db/client";
import * as schema from "./db/schema";
import { hashPassword, verifyPassword } from "./lib/password";

export const createAuth = (env: Env, db: Database) =>
  betterAuth({
    appName: "Writea",
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
  });

export type Auth = ReturnType<typeof createAuth>;
export type SessionUser = Auth["$Infer"]["Session"]["user"];
