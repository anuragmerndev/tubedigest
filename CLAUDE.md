# CLAUDE.md — TubeDigest

## What This Is

TubeDigest — a multi-tenant SaaS YouTube Video Summarizer. Users paste a YouTube URL, the app extracts captions, sends them to OpenAI for summarization, and returns a concise summary. Built as an Upwork portfolio piece showcasing SaaS infrastructure (auth, billing, multi-tenancy, dashboard) with an integrated AI feature.

## Project Type

Full-stack monorepo app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js (App Router) + Tailwind CSS + shadcn/ui |
| Backend | NestJS (separate service) |
| Auth | Clerk (frontend SDK + backend JWT verification) |
| Database | PostgreSQL on Neon (free tier) |
| ORM | TypeORM |
| Multi-tenancy | Shared DB, tenant column, Postgres-native RLS |
| Billing | Dodo Payments (subscriptions, webhooks, usage-based) |
| AI | OpenAI API (summarization) |
| Transcript | YouTube captions library (Node.js) |
| Logging | Winston (structured JSON) + request logging middleware |
| API Docs | Swagger/OpenAPI |

## Monorepo Structure

```
tubedigest/
├── apps/
│   ├── web/              # Next.js frontend (Vercel)
│   └── api/              # NestJS backend (Render)
├── packages/             # Shared types, utils (if needed)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .github/
    └── workflows/        # CI: lint → type-check → build
```

## Architecture

### Communication
- Frontend ↔ Backend via REST (17 endpoints)
- Backend ↔ external services (Dodo, OpenAI, YouTube captions) server-side only

### Auth Flow
1. User signs in via Clerk (frontend)
2. Clerk issues JWT with user_id, org_id, role
3. Frontend sends JWT in Authorization header
4. NestJS AuthGuard verifies JWT with Clerk's public key
5. Middleware extracts org_id → runs `SET LOCAL app.org_id` on DB connection
6. RLS policies enforce tenant isolation automatically

### AI Pipeline
```
YouTube URL → extract video ID → check cache (videos table)
  → cache miss: extract captions → truncate to 4000 tokens → OpenAI summarize → store in videos table
  → cache hit: return cached summary
→ create user_summaries record → increment usage_records → return summary
```

### Multi-Tenancy
- Organizations are the tenant unit
- Two roles: owner, member
- RLS on: users, invitations, subscriptions, usage_records, user_summaries
- No RLS on: videos (shared cache across all orgs)

## Database Schema

| Table | Key Columns | RLS |
|-------|-------------|-----|
| organizations | id, name, slug, plan | No |
| users | id, org_id, clerk_id, email, role (owner/member) | Yes |
| invitations | id, org_id, email, role, status, invited_by | Yes |
| subscriptions | id, org_id, dodo_plan_id, status, current_period_start/end | Yes |
| usage_records | id, org_id, period, count, limit | Yes |
| videos | id, youtube_video_id, url, transcript, summary, created_at | No |
| user_summaries | id, user_id, org_id, video_id, created_at | Yes |

## API Endpoints

### Auth & Onboarding
- `POST /api/auth/sync` — sync Clerk user to local DB
- `POST /api/onboarding/org` — create org during onboarding

### Organizations
- `GET /api/orgs/current` — get current org
- `PATCH /api/orgs/current` — update org (owner only)

### Members
- `GET /api/members` — list org members
- `POST /api/invitations` — invite member (owner only)
- `GET /api/invitations` — list pending invitations (owner only)
- `DELETE /api/invitations/:id` — cancel invitation (owner only)
- `DELETE /api/members/:id` — remove member (owner only)

### Summarizer
- `POST /api/summaries` — submit YouTube URL, get summary directly (sync)
- `GET /api/summaries` — list user's past summaries (paginated)
- `GET /api/summaries/:id` — get single summary

### Billing
- `GET /api/billing/subscription` — current subscription (owner only)
- `POST /api/billing/checkout` — create Dodo checkout session (owner only)
- `POST /api/billing/portal` — get billing portal URL (owner only)
- `POST /api/billing/webhook` — Dodo webhook handler (signature verified)

### Usage
- `GET /api/usage/current` — current period usage (count/limit)
- `GET /api/usage/daily` — daily usage for chart

## Error Format

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Invalid YouTube URL"
}
```

Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 422 unprocessable (no captions), 429 rate limited

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render (free tier) |
| Database | Neon (free tier) |

## CI/CD

GitHub Actions: `lint → type-check → build` on push to main. Vercel and Render auto-deploy after CI passes.

## Key Behaviors

- **Rate limiting:** per-user on summarizer endpoint
- **Transcript truncation:** 4000 tokens (~20 min of video). If truncated, response includes `truncated: true`
- **Video caching:** same youtube_video_id = reuse cached transcript + summary. Saves API costs
- **Fail gracefully:** no captions → 422 with clear message, don't charge usage
- **Logging:** Winston structured JSON + request middleware (org_id, user_id, endpoint, response time)

## Commands

```bash
pnpm install              # install all dependencies
pnpm dev                  # run both apps in dev mode
pnpm build                # build all apps
pnpm lint                 # lint all apps
pnpm type-check           # type-check all apps
```

## Environment Variables

### Frontend (apps/web/.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=
```

### Backend (apps/api/.env)
```
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
OPENAI_API_KEY=
PORT=
```

## Git Workflow

### Branching
- **Each phase gets its own branch.** Never commit phase work directly to main.
  - `phase-1/foundation`
  - `phase-2/core-backend`
  - `phase-3/billing`
  - `phase-4/frontend`
  - `phase-5/deploy-polish`
- Merge to main only when the phase is fully complete and working.

### Commits
- **One commit per task.** Each numbered task in the build sequence (1.1, 1.2, 2.1, etc.) is one commit.
- Use `/commit` skill for every commit — no manual commit messages.
- Never batch multiple tasks into one commit.
- Never commit broken code. Each commit must leave the app in a working state.

## Frontend Design

UI designs are created in **Claude Design** (Anthropic Labs) before implementation.

### Rules
- **Never improvise UI.** All frontend components, layouts, and pages must match the Claude Design output exactly — colors, spacing, typography, component structure.
- **Design first, implement second.** If a screen hasn't been designed in Claude Design yet, do not build it. Ask for the design first.
- **Design system is the source of truth.** Claude Design reads the codebase and generates a consistent design system. Use those tokens (colors, fonts, spacing) throughout — do not hardcode arbitrary values.
- **shadcn/ui + Tailwind** are the implementation layer. Use shadcn/ui components where they match the design. Extend with Tailwind utility classes to match Claude Design output precisely.

## Security Rules

These are non-negotiable. Apply from the first commit, never bypass.

### Authentication & Authorization
- **Never trust client-sent org_id or user_id.** Always extract from verified Clerk JWT only.
- **Always verify Clerk JWT** in NestJS AuthGuard before any protected route handler runs.
- **RLS must always be set.** Every DB connection in a request context must run `SET LOCAL app.org_id = '...'` before any query. No exceptions.
- **Role guards on all owner-only endpoints.** Never rely on frontend to hide owner actions — enforce on backend.

### Input Validation
- **Validate all incoming request bodies** with `class-validator` DTOs in NestJS. No raw `req.body` access.
- **Validate YouTube URLs** before processing — reject anything that doesn't parse to a valid youtube.com/youtu.be URL.
- **Never use raw string interpolation in queries.** TypeORM parameterized queries only.

### Secrets & Environment
- **Never commit `.env` files.** Only `.env.example` with placeholder values.
- **Never log secrets, tokens, or API keys.** Winston must never output `DATABASE_URL`, `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, `DODO_API_KEY`, or any Authorization header values.
- **Never expose stack traces in API responses.** Production error responses use the standard error format only — no `stack`, no internal details.

### Webhooks
- **Always verify Dodo webhook signatures** before processing any webhook payload. Reject unverified requests with 401.

### HTTP Security
- **Use `helmet`** in NestJS for security headers (CSP, HSTS, X-Frame-Options, etc.).
- **CORS restricted** to the frontend domain only. No wildcard `*` in production.
- **Rate limiting** on all endpoints, stricter on `/api/summaries` (summarizer) per user.

### Multi-Tenancy Isolation
- **Every tenant-scoped query must go through RLS.** Never add manual `WHERE org_id = ?` as the only isolation layer — RLS is the safety net.
- **`videos` table is the only cross-tenant table.** All other tables are tenant-scoped. Never add cross-tenant queries elsewhere.

### Git Hygiene
- `.env`, `.env.local`, `.env.production` in `.gitignore` from day one.
- No API keys, connection strings, or secrets ever appear in commit history.

## Planning Docs

Full planning documentation lives in the Obsidian vault:
`~/Desktop/Anurag/Obsidian/Vault/Anurag Vault/upwork-plan/ai-saas-boilerplate/`

Decisions log: `ai-saas-boilerplate/decisions/` (001–012)
