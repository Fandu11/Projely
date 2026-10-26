
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const appUrl =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appUrl,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
        input: false,
      },
      lastName: {
        type: "string",
        required: false,
        input: false,
      },
      jobTitle: {
        type: "string",
        required: false,
        input: false,
      },
      bio: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  trustedOrigins: [
    "http://localhost:3000",
    appUrl,
  ],
});
