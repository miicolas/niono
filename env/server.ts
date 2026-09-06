import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),

    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).default("DigiPM <hello@digipm.local>"),
    EMAIL_OUTBOX_DIR: z.string().min(1).default(".data/outbox"),

    ASSET_DIR: z.string().min(1).default(".data/assets"),

    // Assistant IA : AI_MODEL seul (avec AI_GATEWAY_API_KEY) cible la passerelle
    // Vercel ; AI_BASE_URL (+ AI_API_KEY) cible un fournisseur compatible OpenAI.
    AI_MODEL: z.string().min(1).optional(),
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    AI_BASE_URL: z.string().url().optional(),
    AI_API_KEY: z.string().min(1).optional(),

    LOG_REQUESTS: z.enum(["true", "false"]).optional(),

    NODE_ENV: z
      .enum(["development", "production", "testing", "test"])
      .transform((value) => (value === "test" ? "testing" : value))
      .optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    console.error(
      "❌ Variables d'environnement invalides :",
      JSON.stringify(issues, null, 2)
    );
    throw new Error(
      `Variables d'environnement invalides : ${JSON.stringify(issues)}`
    );
  },
});
