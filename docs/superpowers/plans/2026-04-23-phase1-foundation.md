# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Turborepo monorepo with NestJS backend, Next.js frontend, Clerk JWT auth, PostgreSQL RLS multi-tenancy, and CI/CD infrastructure.

**Architecture:** Turborepo monorepo (`apps/api` + `apps/web`). Auth via Clerk JWT verified in a global NestJS `AuthGuard`. Multi-tenant DB isolation via PostgreSQL `SET LOCAL app.org_id` called inside a per-request transaction managed by a global `TenantInterceptor`. Note: spec called this a middleware, but a NestJS interceptor is used instead — it wraps the route handler execution, enabling correct commit-on-success / rollback-on-error lifecycle without relying on response events.

**Tech Stack:** Turborepo 2, pnpm workspaces, NestJS 10, TypeORM 0.3, PostgreSQL, `@clerk/backend`, `@clerk/nextjs`, Next.js 15, Tailwind CSS 3, shadcn/ui, Husky, GitHub Actions, Node 22

---

## File Map

```
tubedigest/
├── .github/workflows/ci.yml
├── .gitignore
├── .husky/pre-commit
├── .env.example
├── package.json                              # root — workspaces, scripts, husky
├── pnpm-workspace.yaml
├── turbo.json
│
├── apps/api/
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── src/
│       ├── main.ts                           # bootstrap: helmet, ValidationPipe, CORS, global prefix
│       ├── app.module.ts                     # root module: Config, TypeORM, Auth, TenantInterceptor
│       ├── config/
│       │   └── database.config.ts            # TypeORM forRootAsync config
│       ├── database/
│       │   └── data-source.ts                # standalone DataSource for TypeORM CLI
│       ├── migrations/
│       │   └── <timestamp>-InitialSchema.ts  # all 7 tables + RLS + indexes
│       ├── auth/
│       │   ├── auth.module.ts                # registers APP_GUARD → AuthGuard
│       │   ├── auth.guard.ts                 # verifies Clerk JWT, sets req.user
│       │   ├── auth.guard.spec.ts
│       │   └── public.decorator.ts           # @Public() opt-out decorator
│       └── common/
│           └── interceptors/
│               ├── tenant.interceptor.ts     # per-request QueryRunner + SET LOCAL + commit/rollback
│               └── tenant.interceptor.spec.ts
│
└── apps/web/
    ├── .env.local.example
    ├── components.json                       # shadcn/ui config
    ├── next.config.ts
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── middleware.ts                     # Clerk route protection
        ├── app/
        │   ├── layout.tsx                    # ClerkProvider root
        │   ├── page.tsx                      # landing (redirect to /dashboard or /sign-in)
        │   └── (auth)/
        │       ├── sign-in/[[...sign-in]]/page.tsx
        │       └── sign-up/[[...sign-up]]/page.tsx
        ├── components/ui/                    # shadcn components (button added as smoke test)
        └── lib/utils.ts                      # cn() from shadcn
```

---

## Task 1: Git init + Monorepo root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/anurag/Desktop/Projects/tubedigest
git init
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "tubedigest",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "husky": "^9.0.0"
  },
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "outputs": []
    }
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
# dependencies
node_modules/
.pnp
.pnp.js

# build outputs
dist/
.next/
out/

# environment files — NEVER commit these
.env
.env.local
.env.production
.env.*.local

# turbo
.turbo/

# misc
.DS_Store
*.log
coverage/
```

- [ ] **Step 6: Create root `.env.example`**

```
# This file is committed. It documents required env vars with placeholder values.
# Copy apps/api/.env.example → apps/api/.env
# Copy apps/web/.env.local.example → apps/web/.env.local
```

- [ ] **Step 7: Create `apps/` and `packages/` directories**

```bash
mkdir -p apps packages
```

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .env.example apps packages
git commit -m "chore: init monorepo root (Turborepo + pnpm workspaces)"
```

---

## Task 2: NestJS app scaffold

**Files:**
- Create: `apps/api/` (via `nest new`)
- Modify: `apps/api/package.json` — add migration scripts + dependencies
- Modify: `apps/api/src/main.ts` — helmet, ValidationPipe, CORS, global prefix
- Delete: `apps/api/src/app.controller.ts`, `apps/api/src/app.controller.spec.ts`, `apps/api/src/app.service.ts`

- [ ] **Step 1: Scaffold NestJS app**

```bash
cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git --strict
cd ..
```

When prompted for package manager, select `pnpm`.

- [ ] **Step 2: Install additional API dependencies**

```bash
cd apps/api
pnpm add @nestjs/config @nestjs/typeorm typeorm pg @clerk/backend helmet class-validator class-transformer
pnpm add -D @types/pg ts-node tsconfig-paths
cd ../..
```

- [ ] **Step 3: Remove boilerplate controller and service**

```bash
rm apps/api/src/app.controller.ts apps/api/src/app.controller.spec.ts apps/api/src/app.service.ts
```

- [ ] **Step 4: Rewrite `apps/api/src/app.module.ts`**

Replace the entire file:

```typescript
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

Note: TypeORM, AuthModule, and TenantInterceptor are added in later tasks.

- [ ] **Step 5: Rewrite `apps/api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}
bootstrap();
```

- [ ] **Step 6: Add migration scripts to `apps/api/package.json`**

Add to the `"scripts"` block in `apps/api/package.json`:

```json
"type-check": "tsc --noEmit",
"migration:generate": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:generate",
"migration:run": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run",
"migration:revert": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:revert"
```

Also add a `"lint"` script if not present (NestJS CLI may use `eslint`):
```json
"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
```

- [ ] **Step 7: Create `apps/api/.env.example`**

```
DATABASE_URL=postgresql://user:pass@localhost:5432/tubedigest
CLERK_SECRET_KEY=sk_test_placeholder
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
DODO_API_KEY=placeholder
DODO_WEBHOOK_SECRET=placeholder
OPENAI_API_KEY=placeholder
FRONTEND_URL=http://localhost:3000
PORT=3001
```

- [ ] **Step 8: Verify app starts**

```bash
cd apps/api
cp .env.example .env
pnpm start:dev
```

Expected: Server starts on port 3001. No errors. Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add apps/api
git commit -m "chore: scaffold NestJS app with helmet, ValidationPipe, CORS"
```

---

## Task 3: TypeORM connection + DataSource

**Files:**
- Create: `apps/api/src/config/database.config.ts`
- Create: `apps/api/src/database/data-source.ts`
- Modify: `apps/api/src/app.module.ts` — add TypeOrmModule

- [ ] **Step 1: Create `apps/api/src/config/database.config.ts`**

```typescript
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
    },
  }),
);
```

- [ ] **Step 2: Create `apps/api/src/database/data-source.ts`**

```typescript
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
```

- [ ] **Step 3: Update `apps/api/src/app.module.ts` to include TypeORM**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
    }),
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```bash
cd apps/api
pnpm type-check
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/config apps/api/src/database apps/api/src/app.module.ts
git commit -m "feat: configure TypeORM with migrations, connection pool, no synchronize"
```

---

## Task 4: Next.js scaffold + Tailwind + shadcn/ui

**Files:**
- Create: `apps/web/` (via `create-next-app`)
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/.env.local.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd apps
pnpm create next-app web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint \
  --skip-install
cd ..
pnpm install
```

- [ ] **Step 2: Install web dependencies**

```bash
cd apps/web
pnpm add @clerk/nextjs
cd ../..
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd apps/web
pnpm dlx shadcn@latest init --defaults
cd ../..
```

When prompted:
- Style: `default`
- Base color: `slate`
- CSS variables: `yes`

- [ ] **Step 4: Add a button component to verify shadcn works**

```bash
cd apps/web
pnpm dlx shadcn@latest add button
cd ../..
```

- [ ] **Step 5: Add `type-check` and `lint` scripts to `apps/web/package.json`**

Add to the `"scripts"` block:

```json
"type-check": "tsc --noEmit",
"lint": "next lint"
```

- [ ] **Step 6: Create `apps/web/.env.local.example`**

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 7: Create `apps/web/src/middleware.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|ttf|woff2?|png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 8: Create `apps/web/src/app/layout.tsx`**

```tsx
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TubeDigest',
  description: 'AI-powered YouTube video summarizer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 9: Create `apps/web/src/app/page.tsx`**

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');
  redirect('/sign-in');
}
```

- [ ] **Step 10: Create sign-in page**

Create directory and file: `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`

```bash
mkdir -p apps/web/src/app/\(auth\)/sign-in/\[\[...sign-in\]\]
```

```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 11: Create sign-up page**

Create directory and file: `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

```bash
mkdir -p apps/web/src/app/\(auth\)/sign-up/\[\[...sign-up\]\]
```

```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 12: Create placeholder dashboard page (so redirect doesn't 404)**

```bash
mkdir -p apps/web/src/app/dashboard
```

Create `apps/web/src/app/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <div>Dashboard — coming in Phase 4</div>;
}
```

- [ ] **Step 13: Type-check Next.js app**

```bash
cd apps/web
cp .env.local.example .env.local
pnpm type-check
```

Expected: No TypeScript errors. (Clerk types resolve with placeholder keys.)

- [ ] **Step 14: Commit**

```bash
git add apps/web
git commit -m "chore: scaffold Next.js 15 with Tailwind, shadcn/ui, Clerk pages"
```

---

## Task 5: Turborepo pipeline + Husky + CI

**Files:**
- Modify: `turbo.json` — finalize pipeline
- Create: `.husky/pre-commit`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Install Husky at root**

```bash
pnpm add -D husky -w
pnpm exec husky init
```

This creates `.husky/pre-commit` with a placeholder.

- [ ] **Step 2: Set pre-commit hook content**

Replace `.husky/pre-commit` with:

```bash
#!/bin/sh
pnpm lint && pnpm type-check && pnpm build
```

- [ ] **Step 3: Create `.github/workflows/ci.yml`**

```bash
mkdir -p .github/workflows
```

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Lint, Type-check, Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type-check
        run: pnpm type-check

      - name: Build
        run: pnpm build
```

- [ ] **Step 4: Verify Turborepo can run lint and type-check across both apps**

```bash
pnpm lint
pnpm type-check
```

Expected: Both apps report no errors. Turbo caches results.

- [ ] **Step 5: Commit**

```bash
git add .husky .github turbo.json package.json
git commit -m "chore: add Husky pre-commit hook and GitHub Actions CI (Node 22)"
```

---

## Task 6: Initial database migration (7 tables + RLS + indexes)

**Files:**
- Create: `apps/api/src/migrations/<timestamp>-InitialSchema.ts`

This migration is hand-written (not generated) since no entities exist yet. We'll create it manually.

**Prerequisite:** A local PostgreSQL instance must be running. Create the database:

```bash
createdb tubedigest
# or via psql:
# psql -c "CREATE DATABASE tubedigest;"
```

Update `apps/api/.env` to point to your local DB:

```
DATABASE_URL=postgresql://localhost:5432/tubedigest
```

- [ ] **Step 1: Create the migration file**

Create `apps/api/src/migrations/1745400000000-InitialSchema.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1745400000000 implements MigrationInterface {
  name = 'InitialSchema1745400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(
      `CREATE TYPE "plan_enum" AS ENUM ('free', 'pro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "role_enum" AS ENUM ('owner', 'member')`,
    );
    await queryRunner.query(
      `CREATE TYPE "invitation_status_enum" AS ENUM ('pending', 'accepted', 'cancelled')`,
    );

    // organizations (no RLS — looked up before tenant context is set)
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "name"       varchar     NOT NULL,
        "slug"       varchar     NOT NULL,
        "plan"       "plan_enum" NOT NULL DEFAULT 'free',
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_organizations"      PRIMARY KEY ("id")
      )
    `);

    // users (RLS)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "clerk_id"   varchar     NOT NULL,
        "email"      varchar     NOT NULL,
        "role"       "role_enum" NOT NULL DEFAULT 'member',
        "org_id"     uuid        NOT NULL,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_clerk_id" UNIQUE ("clerk_id"),
        CONSTRAINT "PK_users"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_org"      FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // invitations (RLS)
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"     uuid                     NOT NULL,
        "email"      varchar                  NOT NULL,
        "role"       "role_enum"              NOT NULL DEFAULT 'member',
        "status"     "invitation_status_enum" NOT NULL DEFAULT 'pending',
        "invited_by" uuid                     NOT NULL,
        "created_at" TIMESTAMP                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_invitations_org"  FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invitations_user" FOREIGN KEY ("invited_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // subscriptions (RLS)
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                   uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"               uuid      NOT NULL,
        "dodo_plan_id"         varchar   NOT NULL,
        "status"               varchar   NOT NULL,
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end"   TIMESTAMP NOT NULL,
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscriptions_org_id" UNIQUE ("org_id"),
        CONSTRAINT "PK_subscriptions"        PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_org"    FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // usage_records (RLS)
    await queryRunner.query(`
      CREATE TABLE "usage_records" (
        "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"     uuid      NOT NULL,
        "period"     varchar   NOT NULL,
        "count"      integer   NOT NULL DEFAULT 0,
        "limit"      integer   NOT NULL DEFAULT 10,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usage_records_org_period" UNIQUE ("org_id", "period"),
        CONSTRAINT "PK_usage_records"            PRIMARY KEY ("id"),
        CONSTRAINT "FK_usage_records_org"        FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // videos (no RLS — shared cross-tenant cache)
    await queryRunner.query(`
      CREATE TABLE "videos" (
        "id"               uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "youtube_video_id" varchar   NOT NULL,
        "url"              varchar   NOT NULL,
        "transcript"       text,
        "summary"          text,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_videos_youtube_video_id" UNIQUE ("youtube_video_id"),
        CONSTRAINT "PK_videos"                  PRIMARY KEY ("id")
      )
    `);

    // user_summaries (RLS)
    await queryRunner.query(`
      CREATE TABLE "user_summaries" (
        "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid      NOT NULL,
        "org_id"     uuid      NOT NULL,
        "video_id"   uuid      NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_summaries"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_summaries_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_summaries_video" FOREIGN KEY ("video_id")
          REFERENCES "videos"("id") ON DELETE CASCADE
      )
    `);

    // ── Indexes ──────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX "IDX_users_clerk_id"             ON "users"          ("clerk_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_org_id"               ON "users"          ("org_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_org_id"         ON "invitations"    ("org_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_org_email"      ON "invitations"    ("org_id", "email")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_summaries_user_id"     ON "user_summaries" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_summaries_org_id"      ON "user_summaries" ("org_id")`);

    // ── RLS policies ─────────────────────────────────────────────────────────
    // users table uses org_id directly
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "users" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation" ON "users"
        USING (org_id = current_setting('app.org_id')::uuid)
    `);

    for (const table of ['invitations', 'subscriptions', 'usage_records', 'user_summaries']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation" ON "${table}"
          USING (org_id = current_setting('app.org_id')::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['user_summaries', 'videos', 'usage_records', 'subscriptions', 'invitations', 'users', 'organizations']) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS "invitation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_enum"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
```

- [ ] **Step 2: Run the migration**

```bash
cd apps/api
pnpm migration:run
```

Expected output:
```
query: SELECT * FROM "migrations" ...
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
...
Migration InitialSchema1745400000000 has been executed successfully.
```

- [ ] **Step 3: Verify all 7 tables and RLS exist**

```bash
psql tubedigest -c "\dt"
```

Expected: 8 rows — `migrations` + 7 app tables.

```bash
psql tubedigest -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

Expected:
```
 tablename      | rowsecurity
----------------+-------------
 invitations    | t
 migrations     | f
 organizations  | f
 subscriptions  | t
 usage_records  | t
 user_summaries | t
 users          | t
 videos         | f
```

- [ ] **Step 4: Verify indexes**

```bash
psql tubedigest -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;"
```

Expected to include all 9 constraint indexes + 6 explicit indexes created above.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/migrations
git commit -m "feat: add initial schema migration (7 tables, RLS, indexes)"
```

---

## Task 7: Clerk AuthGuard (backend)

**Files:**
- Create: `apps/api/src/auth/public.decorator.ts`
- Create: `apps/api/src/auth/auth.guard.ts`
- Create: `apps/api/src/auth/auth.guard.spec.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts` — import AuthModule

- [ ] **Step 1: Create `apps/api/src/auth/public.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Write the failing test first**

Create `apps/api/src/auth/auth.guard.spec.ts`:

```typescript
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as clerkBackend from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

function makeContext(
  headers: Record<string, string>,
  isPublic = false,
): ExecutionContext {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

  const request = { headers, user: undefined as unknown };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _reflector: reflector,
    _request: request,
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = new Reflector();
    guard = new AuthGuard(reflector);
  });

  it('passes public routes without a token', async () => {
    const ctx = makeContext({}, true);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('throws 401 when Authorization header is missing', async () => {
    const ctx = makeContext({});
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when token scheme is not Bearer', async () => {
    const ctx = makeContext({ authorization: 'Basic abc123' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when verifyToken rejects', async () => {
    jest.spyOn(clerkBackend, 'verifyToken').mockRejectedValue(new Error('expired'));
    const ctx = makeContext({ authorization: 'Bearer bad-token' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user payload to req on valid token', async () => {
    const mockPayload = {
      sub: 'user_clerk_123',
      org_id: 'a1b2c3d4-0000-0000-0000-000000000000',
      org_role: 'org:owner',
    };
    jest.spyOn(clerkBackend, 'verifyToken').mockResolvedValue(mockPayload as any);

    const request = { headers: { authorization: 'Bearer valid' }, user: undefined as unknown };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      clerkUserId: 'user_clerk_123',
      orgId: 'a1b2c3d4-0000-0000-0000-000000000000',
      role: 'org:owner',
    });
  });
});
```

- [ ] **Step 3: Run tests — expect failure**

```bash
cd apps/api
pnpm test auth.guard.spec.ts
```

Expected: FAIL — `Cannot find module './auth.guard'`

- [ ] **Step 4: Implement `apps/api/src/auth/auth.guard.ts`**

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface RequestUser {
  clerkUserId: string;
  orgId: string;
  role: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user: RequestUser;
    }>();

    const token = this.extractToken(request.headers);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      request.user = {
        clerkUserId: payload.sub,
        orgId: payload.org_id as string,
        role: payload.org_role as string,
      };

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractToken(headers: Record<string, string>): string | null {
    const authorization = headers['authorization'] ?? '';
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
```

- [ ] **Step 5: Run tests — expect all pass**

```bash
cd apps/api
pnpm test auth.guard.spec.ts
```

Expected: All 5 tests pass.

- [ ] **Step 6: Create `apps/api/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 7: Import AuthModule in `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
    }),
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Type-check**

```bash
cd apps/api
pnpm type-check
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts
git commit -m "feat: add Clerk JWT AuthGuard with @Public() opt-out decorator"
```

---

## Task 8: Clerk frontend integration

**Files:**
- Verify: `apps/web/src/app/layout.tsx` — ClerkProvider already added in Task 4
- Verify: `apps/web/src/middleware.ts` — already added in Task 4

No new files — this task verifies the existing scaffold works end-to-end with Clerk.

- [ ] **Step 1: Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in `.env.local`**

```bash
cat apps/web/.env.local
```

Expected: File exists with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder`

Note: With a placeholder key, Clerk components will error at runtime but the app will build and type-check successfully. Real keys are needed for functional testing.

- [ ] **Step 2: Type-check web app**

```bash
cd apps/web
pnpm type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Build web app**

```bash
cd apps/web
pnpm build
```

Expected: Build succeeds. (Next.js may warn about Clerk key being a placeholder — that is expected.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src
git commit -m "feat: integrate Clerk in Next.js (ClerkProvider, sign-in/up pages, middleware)"
```

---

## Task 9: Tenant interceptor (per-request QueryRunner + SET LOCAL)

**Files:**
- Create: `apps/api/src/common/interceptors/tenant.interceptor.ts`
- Create: `apps/api/src/common/interceptors/tenant.interceptor.spec.ts`
- Modify: `apps/api/src/app.module.ts` — register TenantInterceptor globally, exclude webhook

> **Implementation note:** The spec calls this a middleware, but a NestJS interceptor is used instead. An interceptor wraps the route handler's `Observable`, enabling proper commit on success and rollback on error — not possible with `res.on('finish')` in plain middleware.

- [ ] **Step 1: Write the failing test first**

Create `apps/api/src/common/interceptors/tenant.interceptor.spec.ts`:

```typescript
import { TenantInterceptor } from './tenant.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { of, throwError, lastValueFrom } from 'rxjs';

function makeQueryRunner(overrides: Partial<QueryRunner> = {}): jest.Mocked<QueryRunner> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([{ set_config: 'a1b2c3d4-0000-0000-0000-000000000000' }]),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    isReleased: false,
    ...overrides,
  } as unknown as jest.Mocked<QueryRunner>;
}

function makeDataSource(qr: QueryRunner): jest.Mocked<DataSource> {
  return {
    createQueryRunner: jest.fn().mockReturnValue(qr),
  } as unknown as jest.Mocked<DataSource>;
}

function makeContext(orgId: string | undefined): ExecutionContext {
  const req = { user: orgId ? { orgId } : undefined, queryRunner: undefined as unknown };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown = 'ok'): CallHandler {
  return { handle: () => of(value) };
}

function makeErrorHandler(error: Error): CallHandler {
  return { handle: () => throwError(() => error) };
}

describe('TenantInterceptor', () => {
  it('skips QueryRunner when req.user is undefined', async () => {
    const qr = makeQueryRunner();
    const ds = makeDataSource(qr);
    const interceptor = new TenantInterceptor(ds);

    const ctx = makeContext(undefined);
    const handler = makeHandler();
    const obs = await interceptor.intercept(ctx, handler);
    await lastValueFrom(obs);

    expect(ds.createQueryRunner).not.toHaveBeenCalled();
  });

  it('skips QueryRunner when orgId is not a valid UUID', async () => {
    const qr = makeQueryRunner();
    const ds = makeDataSource(qr);
    const interceptor = new TenantInterceptor(ds);

    const ctx = makeContext('not-a-uuid');
    const handler = makeHandler();
    const obs = await interceptor.intercept(ctx, handler);
    await lastValueFrom(obs);

    expect(ds.createQueryRunner).not.toHaveBeenCalled();
  });

  it('creates QueryRunner, calls set_config, attaches to req, commits on success', async () => {
    const orgId = 'a1b2c3d4-0000-0000-0000-000000000000';
    const qr = makeQueryRunner();
    const ds = makeDataSource(qr);
    const interceptor = new TenantInterceptor(ds);

    const ctx = makeContext(orgId);
    const req = ctx.switchToHttp().getRequest<{ queryRunner: QueryRunner }>();
    const handler = makeHandler('result');
    const obs = await interceptor.intercept(ctx, handler);
    const result = await lastValueFrom(obs);

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();
    expect(qr.query).toHaveBeenCalledWith(
      `SELECT set_config('app.org_id', $1, true)`,
      [orgId],
    );
    expect(req.queryRunner).toBe(qr);
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('rolls back and releases QueryRunner on handler error', async () => {
    const orgId = 'a1b2c3d4-0000-0000-0000-000000000000';
    const qr = makeQueryRunner();
    const ds = makeDataSource(qr);
    const interceptor = new TenantInterceptor(ds);

    const ctx = makeContext(orgId);
    const error = new Error('handler boom');
    const handler = makeErrorHandler(error);
    const obs = await interceptor.intercept(ctx, handler);

    await expect(lastValueFrom(obs)).rejects.toThrow('handler boom');

    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd apps/api
pnpm test tenant.interceptor.spec.ts
```

Expected: FAIL — `Cannot find module './tenant.interceptor'`

- [ ] **Step 3: Create `apps/api/src/common/interceptors/tenant.interceptor.ts`**

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';
import { RequestUser } from '../../auth/auth.guard';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<{
      user?: RequestUser;
      queryRunner?: unknown;
    }>();

    const orgId = req.user?.orgId;

    // Skip tenant context for unauthenticated (public) routes
    if (!orgId || !UUID_REGEX.test(orgId)) {
      return next.handle();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // set_config with local=true is equivalent to SET LOCAL — scoped to current transaction
    await queryRunner.query(`SELECT set_config('app.org_id', $1, true)`, [orgId]);
    req.queryRunner = queryRunner;

    return next.handle().pipe(
      mergeMap((data) =>
        from(
          queryRunner
            .commitTransaction()
            .then(() => queryRunner.release())
            .then(() => data as unknown),
        ),
      ),
      catchError((err: unknown) =>
        from(
          queryRunner
            .rollbackTransaction()
            .then(() => queryRunner.release())
            .then(() => throwError(() => err)),
        ).pipe(mergeMap((obs) => obs)),
      ),
    );
  }
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
cd apps/api
pnpm test tenant.interceptor.spec.ts
```

Expected: All 4 tests pass.

- [ ] **Step 5: Register TenantInterceptor globally in `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
    }),
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
```

Note: The webhook route (`/api/billing/webhook`) is excluded automatically — it uses `@Public()` so `req.user` is undefined, and the interceptor skips QueryRunner setup when `orgId` is absent.

- [ ] **Step 6: Run all tests**

```bash
cd apps/api
pnpm test
```

Expected: All tests pass. No failures.

- [ ] **Step 7: Type-check**

```bash
cd apps/api
pnpm type-check
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/common apps/api/src/app.module.ts
git commit -m "feat: add TenantInterceptor — per-request QueryRunner with RLS SET LOCAL"
```

---

## Phase 1 Done — Verification Checklist

Run these before declaring Phase 1 complete:

```bash
# Full monorepo checks
pnpm lint
pnpm type-check
pnpm build

# API tests
cd apps/api && pnpm test

# Migration smoke test (requires local Postgres)
cd apps/api && pnpm migration:revert && pnpm migration:run
```

Confirm all deliverables from the spec:

- [ ] `pnpm dev` starts both apps without errors
- [ ] `pnpm build` passes across both apps
- [ ] `pnpm lint` and `pnpm type-check` pass
- [ ] Husky pre-commit hook runs lint + type-check + build
- [ ] CI workflow file exists and is valid YAML
- [ ] `migration:run` creates all 7 tables + RLS policies + indexes
- [ ] `auth.guard.spec.ts` — 5 tests pass
- [ ] `tenant.interceptor.spec.ts` — 4 tests pass
- [ ] A request without a JWT is rejected 401 (AuthGuard rejects)
- [ ] `set_config('app.org_id', ...)` is called per authenticated request (TenantInterceptor)
