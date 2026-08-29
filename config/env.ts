import { z } from "zod";

// Validated at boot (imported by next.config.ts). Fails fast if anything is missing.

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z
    .string()
    .refine((v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"), {
      message: "must be a mongodb connection string",
    }),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().min(1).default("15m"),
  JWT_REFRESH_TTL: z.string().min(1).default("30d"),
  JWT_ISSUER: z.string().min(1).default("job-board"),
  JWT_AUDIENCE: z.string().min(1).default("job-board-api"),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Public base URL for uploaded media (R2 custom domain / r2.dev). Client-safe.
  NEXT_PUBLIC_MEDIA_BASE_URL: z.string().url(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
export type Env = ServerEnv & ClientEnv;

const rawClient = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
};

function format(issues: z.ZodIssue[]): string {
  return issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}

function loadEnv(): Env {
  const client = clientSchema.safeParse(rawClient);
  if (!client.success) {
    throw new Error(`Invalid client env:\n${format(client.error.issues)}`);
  }
  if (typeof window !== "undefined") return { ...client.data } as Env;

  const server = serverSchema.safeParse(process.env);
  if (!server.success) {
    throw new Error(`Invalid server env:\n${format(server.error.issues)}`);
  }
  return { ...server.data, ...client.data };
}

export const env: Env = loadEnv();
