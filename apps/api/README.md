# TubeDigest API

NestJS backend service for TubeDigest. Handles authentication, multi-tenant data isolation, YouTube video summarization, usage tracking, and billing.

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (Neon) + TypeORM
- **Auth:** Clerk JWT verification
- **Multi-tenancy:** Row-Level Security (RLS) via per-request `SET LOCAL`
- **Billing:** Dodo Payments (subscriptions + webhooks)
- **AI:** OpenAI API (summarization)
- **Transcripts:** Apify (YouTube caption extraction)
- **Logging:** Winston (structured JSON)
- **API Docs:** Swagger/OpenAPI (dev only)

## API Endpoints

### Auth & Onboarding
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/sync` | Sync Clerk user to local DB | Yes |
| POST | `/api/auth/webhook` | Clerk webhook handler | Public (signature verified) |
| POST | `/api/onboarding/org` | Create organization | Yes |

### Organizations
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/orgs/current` | Get current organization | Yes |
| PATCH | `/api/orgs/current` | Update organization | Owner |

### Members & Invitations
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/members` | List org members | Yes |
| DELETE | `/api/members/:id` | Remove member | Owner |
| POST | `/api/invitations` | Invite member | Owner |
| GET | `/api/invitations` | List pending invitations | Owner |
| DELETE | `/api/invitations/:id` | Cancel invitation | Owner |

### Summaries
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/summaries` | Summarize a YouTube video | Yes (rate limited) |
| GET | `/api/summaries` | List user's summaries (paginated) | Yes |
| GET | `/api/summaries/:id` | Get single summary | Yes |

### Billing
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/billing/subscription` | Current subscription | Owner |
| POST | `/api/billing/checkout` | Create checkout session | Owner |
| POST | `/api/billing/portal` | Get billing portal URL | Owner |
| POST | `/api/billing/webhook` | Dodo webhook handler | Public (signature verified) |

### Usage
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/usage/current` | Current period usage | Yes |
| GET | `/api/usage/daily` | Daily usage for chart | Yes |

## Project Structure

```
src/
├── common/
│   ├── filters/          # Global exception handler
│   ├── guards/           # Rate limiting (per-user)
│   ├── interceptors/     # Tenant context, response transform
│   └── middleware/        # Request logging
├── database/
│   └── migrations/       # TypeORM migrations
└── modules/
    ├── auth/             # Clerk JWT verification, guards, decorators
    ├── billing/          # Dodo Payments integration
    ├── members/          # Member + invitation management
    ├── onboarding/       # Org creation flow
    ├── orgs/             # Organization CRUD
    ├── summaries/        # YouTube summarization + transcript extraction
    └── usage/            # Credit tracking + daily stats
```

## Security

- **Global auth guard** — all endpoints require JWT unless marked `@Public()`
- **RLS enforcement** — every request sets `app.org_id` on the DB connection
- **Role guards** — owner-only endpoints enforced on backend
- **Webhook verification** — Clerk (svix) and Dodo (standardwebhooks) signatures verified
- **Rate limiting** — 100 req/min global, 10 req/min on summarizer
- **Helmet** — security headers (CSP, HSTS, X-Frame-Options)
- **Input validation** — `class-validator` DTOs on all request bodies

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Start the local database:
   ```bash
   docker compose up -d   # from repo root
   ```

3. Run migrations:
   ```bash
   pnpm migration:run
   ```

4. Start the dev server:
   ```bash
   pnpm dev
   ```

5. Swagger docs available at `http://localhost:3001/api/docs` (dev only).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint and auto-fix |
| `pnpm type-check` | TypeScript type checking |
| `pnpm migration:generate` | Generate migration from entity changes |
| `pnpm migration:run` | Run pending migrations |
| `pnpm migration:revert` | Revert last migration |

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `DODO_API_KEY` | Dodo Payments API key |
| `DODO_WEBHOOK_SECRET` | Dodo webhook signature secret |
| `OPENAI_API_KEY` | OpenAI API key for summarization |
| `APIFY_API_TOKEN` | Apify token for transcript extraction |
| `FRONTEND_URL` | Frontend origin for CORS |
| `PORT` | Server port (default: 3001) |
