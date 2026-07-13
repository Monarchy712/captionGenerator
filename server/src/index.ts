import { createApp } from "./app";
import { config } from "./config";
import { ensurePerKindRules } from "./bootstrap/ensurePerKindRules";

const app = createApp();

async function main() {
  try {
    await ensurePerKindRules();
  } catch (err) {
    console.warn("[bootstrap] ensurePerKindRules skipped:", err);
  }

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Caption Studio running on http://0.0.0.0:${config.port}`);
    console.log(`AI provider: ${config.aiProvider}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
