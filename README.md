# TubeDigest

A multi-tenant SaaS YouTube video summarizer. Paste a YouTube URL, get a concise AI-generated summary. Built with organization-based multi-tenancy, usage-based billing, and role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js (App Router) + Tailwind CSS + shadcn/ui |
| Backend | NestJS |
| Auth | Clerk |
| Database | PostgreSQL (Neon) + TypeORM |
| Multi-tenancy | Row-Level Security (RLS) |
| Billing | Dodo Payments |
| AI | OpenAI API |

## Features

- **AI Summarization** — paste a YouTube URL, get a summary powered by OpenAI
- **Multi-Tenancy** — organization-based isolation with Postgres RLS
- **Role-Based Access** — owner and member roles with backend-enforced permissions
- **Usage Tracking** — per-organization usage limits and daily usage charts
- **Billing** — subscription management via Dodo Payments
- **Team Management** — invite members, manage roles, revoke access
- **Video Caching** — same video = reuse cached summary, saving API costs

## Project Structure

```
tubedigest/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/        # NestJS backend
├── packages/       # Shared types/utils
├── turbo.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local PostgreSQL)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/anuragmerndev/tubedigest.git
   cd tubedigest
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the local database:
   ```bash
   docker compose up -d
   ```

4. Configure environment variables:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
   Fill in your Clerk, OpenAI, and Dodo Payments keys.

5. Run database migrations:
   ```bash
   pnpm --filter api migration:run
   ```

6. Start development servers:
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001/api

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run both apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm type-check` | Type-check all apps |

## License

MIT
