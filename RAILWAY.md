# Railway deploy checklist
#
# 1. Delete the @caption-studio/client service (not needed — server serves the UI)
# 2. Keep only @caption-studio/server (or rename it Caption Studio)
# 3. Add a Postgres database: New → Database → PostgreSQL
# 4. In the server service → Variables, add the env vars listed below
# 5. Settings → Root Directory = repo root (leave empty / ".")
# 6. Settings → Build Command = npm install && npm run build:railway
# 7. Settings → Start Command = npm run start:railway
# 8. Deploy → then run seed once from Railway shell:
#      npm run db:seed -w server
#
# Required variables:
#   DATABASE_URL          (from Railway Postgres → Variable Reference)
#   GROQ_API_KEY
#   AI_PROVIDER=groq
#   ADMIN_PASSWORD
#   CORS_ORIGIN=*
#   NODE_ENV=production
#
# Optional:
#   GROQ_MODEL=llama-3.3-70b-versatile
#   ANTHROPIC_API_KEY + AI_PROVIDER=anthropic   (when you switch to Claude)
