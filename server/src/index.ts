import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Caption Studio running on http://0.0.0.0:${config.port}`);
  console.log(`AI provider: ${config.aiProvider}`);
});
