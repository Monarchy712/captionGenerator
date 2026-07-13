import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Caption Studio API running on http://localhost:${config.port}`);
  console.log(`AI provider: ${config.aiProvider}`);
});
