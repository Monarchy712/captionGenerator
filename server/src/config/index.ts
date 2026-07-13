import path from "path";
import dotenv from "dotenv";

// Load root .env then server .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  adminPassword: process.env.ADMIN_PASSWORD || "caption-studio-admin",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  aiProvider: (process.env.AI_PROVIDER || "anthropic") as "anthropic" | "openai" | "mock",
  claudeModel: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  exampleTopN: parseInt(process.env.EXAMPLE_TOP_N || "5", 10),
} as const;
