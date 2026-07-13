# Caption Studio

Internal AI operating system for generating high-performing crypto clip captions.

The frontend never builds prompts. The backend assembles rules, writing principles, speaker profiles, good/bad examples, and the transcript into a versioned Claude prompt — then stores every like, dislike, edit, and "used" signal for continuous improvement.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, TypeScript, Tailwind, shadcn/ui, React Hook Form, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite + Prisma (Postgres-ready) |
| AI | Anthropic Claude (abstracted provider — OpenAI-ready) |

## Monorepo layout

```
/
├── client/          # React SPA
├── server/          # Express API (controllers → services → repositories)
├── shared/          # Shared TypeScript types
└── package.json     # Workspaces
```

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env (optional — mock AI works out of the box)
cp .env.example .env
# Set ANTHROPIC_API_KEY and AI_PROVIDER=anthropic for live generation

# 3. Database
cd server
npx prisma migrate dev --name init
npm run db:seed
cd ..

# 4. Run
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3001/api/health  
- Admin password: `caption-studio-admin` (override via `ADMIN_PASSWORD`)

## Architecture highlights

- **PromptBuilder** — modular prompt assembly from DB context
- **ExampleRetriever** — SQLite top-N today; swap to Chroma/Qdrant later without touching callers
- **AIProvider** — `ClaudeProvider` / `MockAIProvider`; add `OpenAIProvider` behind the same interface
- **Feedback loop** — likes, dislikes, edits, and "used" all persisted
- **Version history** — caption edits and prompt template changes never overwrite; they create new versions
- **Prompt preview** — inspect the exact assembled prompt before/after generation

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/generate` | — | Generate captions |
| POST | `/api/generate/preview` | — | Preview assembled prompt |
| POST | `/api/feedback` | — | Like / dislike / edit / used |
| GET/PUT | `/api/rules` | Admin | Manage rules |
| GET/POST/PUT/DELETE | `/api/examples` | Admin | Good examples |
| GET/POST/PUT/DELETE | `/api/bad-examples` | Admin | Bad examples |
| GET/POST/PUT/DELETE | `/api/speakers` | List public; write Admin | Speaker profiles |
| GET/PUT | `/api/prompt-template` | Admin | Active template |
| POST | `/api/prompt-template/revert` | Admin | Revert to version |
| POST | `/api/auth/login` | — | Admin login |

Admin routes require header `x-admin-password: <password>`.

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3001` | API port |
| `ADMIN_PASSWORD` | `caption-studio-admin` | Admin gate |
| `AI_PROVIDER` | `mock` | `mock` \| `anthropic` |
| `ANTHROPIC_API_KEY` | — | Required for live Claude |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Model id |
| `DATABASE_URL` | `file:./dev.db` | Prisma SQLite |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin |
| `VITE_API_URL` | `http://localhost:3001` | Client API base |
