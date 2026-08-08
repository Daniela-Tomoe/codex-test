import "server-only";

import { betterAuth } from "better-auth";

import { database } from "@/src/lib/database";

function requiredEnvironmentVariable(name: "APP_URL" | "AUTH_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured before starting TinyNotes.`);
  }

  return value;
}

const secret = requiredEnvironmentVariable("AUTH_SECRET");

if (secret.length < 32) {
  throw new Error("AUTH_SECRET must contain at least 32 characters.");
}

const configuredAppUrl = requiredEnvironmentVariable("APP_URL");
let baseURL: string;

try {
  baseURL = new URL(configuredAppUrl).origin;
} catch {
  throw new Error("APP_URL must be a valid absolute URL.");
}

export const auth = betterAuth({
  appName: "TinyNotes",
  baseURL,
  database,
  secret,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
});
