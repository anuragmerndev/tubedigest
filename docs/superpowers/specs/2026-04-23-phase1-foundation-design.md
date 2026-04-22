# Phase 1: Foundation Design

**Date:** 2026-04-23
**Status:** Approved
**Approach:** Strict sequential (A) — monorepo → NestJS+DB → Next.js → Clerk → Schema+RLS → Auth middleware → CI

---

## 1. Monorepo + CI

### Structure

```
tubedigest/
├── apps/
│   ├── web/              # Next.js (App Router, TypeScript)
│   └── api/              # NestJS (TypeScript)
├── packages/             # reserved, empty for now
├── turbo.json            # pipeline: build, dev, lint, type-check
├── pnpm-workspace.yaml
├── package.json          # root devDeps: turbo, typescript, eslint
├── .env.example          # root-level pointer (app-level .env.example files carry real placeholders)
├── .gitignore            # .env*, node_modules, dist, .next
└── .github/
    └── workflows/
        └── ci.yml
```

### Turborepo Pipeline

| Task | Mode | Cached |
|------|------|--------|
| `dev` | parallel, `persistent: true` | no |
| `build` | sequential (`web` waits on `api` type-check) | yes |
| `lint` | parallel | yes |
| `type-check` | parallel | yes |

### CI (GitHub Actions)

- Node **22**, pnpm cache
- Steps: `pnpm install → lint → type-check → build`
- Triggers: push to `main`
- No deploy step — gate only

### Husky

- Pre-commit hook: `lint + type-check + build`
- Prevents broken commits from reaching CI

---

## 2. NestJS Scaffold + TypeORM + Migrations

### Directory Structure

```
apps/api/src/
├── main.ts                    # bootstrap: helmet, ValidationPipe (whitelist), CORS
├── app.module.ts              # root module
├── config/
│   └── database.config.ts     # TypeORM forRootAsync config (reads DATABASE_URL)
├── database/
│   └── data-source.ts         # standalone DataSource for TypeORM CLI
└── migrations/                # all migration files
```

### TypeORM Config

- `synchronize: false` — always
- `migrationsRun: false` — migrations run explicitly via CLI, never on startup
- `extra: { max: 10, min: 2, idleTimeoutMillis: 30000 }` — connection pool

### Migration Scripts (`apps/api/package.json`)

```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
"migration:run":      "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
"migration:revert":   "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts"
```

### Global Setup (`main.ts`)

- `helmet()` — security headers
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — strips unknown fields
- CORS restricted to `NEXT_PUBLIC_APP_URL` (placeholder in dev)

### Environment (`apps/api/.env.example`)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/tubedigest
CLERK_SECRET_KEY=sk_test_placeholder
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
DODO_API_KEY=placeholder
DODO_WEBHOOK_SECRET=placeholder
OPENAI_API_KEY=placeholder
PORT=3001
```

---

## 3. Next.js Scaffold + Tailwind + shadcn/ui

### Directory Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx             # root layout, ClerkProvider
│   ├── page.tsx               # landing / redirect
│   └── (auth)/
│       ├── sign-in/[[...sign-in]]/page.tsx
│       └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   └── utils.ts               # cn() utility
└── middleware.ts              # Clerk auth middleware
```

### Setup Choices

- shadcn/ui: `default` style, `slate` base color, CSS variables on
- Tailwind v3 (shadcn/ui compatibility)
- No pages built in Phase 1 — scaffold only, `pnpm dev` must work

### Environment (`apps/web/.env.local.example`)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Middleware

- `clerkMiddleware()` protects all routes
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/billing/webhook`

---

## 4. Clerk Integration

### Frontend

- `ClerkProvider` wraps root layout
- `<SignIn />` at `(auth)/sign-in`, `<SignUp />` at `(auth)/sign-up`
- `useAuth()` → `getToken()` → `Authorization: Bearer <token>` on all API calls

### Backend

```
apps/api/src/
└── auth/
    ├── auth.module.ts
    ├── auth.guard.ts          # global guard — verifies JWT, attaches req.user
    └── public.decorator.ts    # @Public() — opt-out for webhook route
```

### Guard Behavior

- Uses `@clerk/backend` `verifyToken()` — JWKS fetched once, cached locally. No per-request API call.
- Extracts `sub` (clerkUserId), `org_id`, `org_role` from JWT claims
- Attaches `{ clerkUserId, orgId, role }` to `req.user`
- Never trusts client-sent org_id — JWT only
- Applied globally; webhook route excluded via `@Public()` decorator

---

## 5. Database Schema + RLS

### Tables

| Table | Key Columns | RLS |
|-------|-------------|-----|
| `organizations` | id (uuid), name, slug (unique), plan (enum: free/pro), created_at | No |
| `users` | id, clerk_id (unique), email, role (enum: owner/member), org_id → organizations | Yes |
| `invitations` | id, org_id, email, role, status (enum: pending/accepted/cancelled), invited_by → users | Yes |
| `subscriptions` | id, org_id (unique), dodo_plan_id, status, current_period_start, current_period_end | Yes |
| `usage_records` | id, org_id, period (YYYY-MM), count, limit — unique(org_id, period) | Yes |
| `videos` | id, youtube_video_id (unique), url, transcript, summary, created_at | No |
| `user_summaries` | id, user_id → users, org_id, video_id → videos, created_at | Yes |

### RLS Policies

Enabled on 5 tenant-scoped tables. Policy pattern:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON <table>
  USING (org_id = current_setting('app.org_id')::uuid);
```

`organizations` and `videos` — no RLS. `organizations` is looked up before org context is set. `videos` is a shared cross-tenant cache by design.

### Indexes

| Table | Index | Reason |
|-------|-------|--------|
| `users` | `clerk_id` (unique) | every auth lookup |
| `users` | `org_id` | member list queries |
| `invitations` | `org_id` | list pending invites |
| `invitations` | `(org_id, email)` composite | duplicate invite check |
| `usage_records` | `(org_id, period)` unique | constraint + query pattern |
| `user_summaries` | `user_id` | history per user |
| `user_summaries` | `org_id` | org-wide history |
| `videos` | `youtube_video_id` (unique) | cache lookup on every summarize |
| `subscriptions` | `org_id` (unique) | billing lookup |

All tables: `id` is UUID, generated via `uuid_generate_v4()`. All created in a single initial migration.

---

## 6. Auth Middleware (Tenant Context)

### Location

```
apps/api/src/common/middleware/tenant.middleware.ts
```

### QueryRunner-per-Request Pattern

`SET LOCAL` only takes effect inside a transaction. The middleware creates a dedicated QueryRunner per request:

```
1. queryRunner = dataSource.createQueryRunner()
2. queryRunner.connect()           # dedicated connection from pool
3. queryRunner.startTransaction()
4. SET LOCAL app.org_id = '<orgId>'
5. attach queryRunner to req        # services use this, not default EntityManager
6. next()
7. finally → commitTransaction() + release()
```

This prevents `SET LOCAL` from leaking across pooled connections between requests.

### Registration

`app.module.ts`:
```ts
consumer
  .apply(TenantMiddleware)
  .exclude({ path: 'api/billing/webhook', method: RequestMethod.POST })
  .forRoutes('*');
```

Runs after `AuthGuard` — `req.user.orgId` is JWT-verified before middleware executes.

---

## Security Rules Applied from Day One

Per `CLAUDE.md` security rules — all enforced in Phase 1:

- `helmet()` global from `main.ts`
- `ValidationPipe({ whitelist: true })` global
- `AuthGuard` global, `@Public()` opt-out only for webhook
- JWT-only org_id extraction — never from request body/params
- `SET LOCAL` inside transaction — no cross-tenant leakage
- `.env*` in `.gitignore` from first commit
- Only `.env.example` files with placeholder values committed
- Winston never logs secrets (configured in Phase 2)

---

## Deliverables

Phase 1 is complete when:

- [ ] `pnpm dev` starts both apps without errors
- [ ] `pnpm build` passes
- [ ] `pnpm lint` and `pnpm type-check` pass
- [ ] Husky pre-commit hook runs lint + type-check
- [ ] CI passes on push to main
- [ ] `migration:run` creates all 7 tables + RLS policies + indexes on a local Postgres instance
- [ ] A request with a valid Clerk JWT reaches a protected route, extracts org_id, and `app.org_id` is set on the DB connection
- [ ] A request without a JWT is rejected with 401
