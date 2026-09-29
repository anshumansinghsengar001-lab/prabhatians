import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/prabhatians"),
  JWT_SECRET: z.string().min(16).default("change_this_in_development_only"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  VIDEO_STORAGE_PROVIDER: z.enum(["local", "mock"]).default("local"),
  VIDEO_STORAGE_PATH: z.string().default("./uploads/videos"),
});

export const env = schema.parse(process.env);
if (env.NODE_ENV === "production" && (env.JWT_SECRET === "change_this_in_development_only" || env.JWT_SECRET === "change_this_in_development")) {
  throw new Error("JWT_SECRET must be configured with a unique secret in production.");
}
