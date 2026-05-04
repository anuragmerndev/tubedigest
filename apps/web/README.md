# TubeDigest Web

Next.js frontend for TubeDigest. Provides the user-facing SaaS interface — authentication, onboarding, video summarization, dashboard, and workspace management.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS 4 + custom shadcn-style components
- **Auth:** Clerk (email/password + OAuth)
- **Icons:** Lucide React
- **Language:** TypeScript 5

## Pages

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and pricing |
| `/sign-in` | Email/password sign-in |
| `/sign-up` | Email/password sign-up with email verification |
| `/sso-callback` | OAuth redirect handler |
| `/onboarding` | 3-step workspace creation (name, use case, welcome) |

### App (authenticated)
| Route | Description |
|-------|-------------|
| `/dashboard` | Usage stats, daily usage chart, recent summaries |
| `/summarize` | Paste YouTube URL, get AI summary |
| `/history` | Paginated list of past summaries with search |
| `/history/:id` | Full summary detail with video metadata |
| `/settings` | Members, billing, and general workspace settings |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in, sign-up pages
│   ├── (app)/            # Authenticated app pages
│   ├── onboarding/       # Workspace setup flow
│   └── sso-callback/     # OAuth handler
├── components/
│   ├── landing/          # Landing page sections + animations
│   ├── layout/           # Shell, sidebar, topbar
│   └── ui/               # Button, card, input, badge, avatar, charts
├── hooks/                # API hooks (useOrg, useSummaries, etc.)
└── lib/
    ├── api.ts            # API client, types, error handling
    └── utils.ts          # Tailwind class merging utility
```

## Components

### Layout
- **Shell** — main app layout (sidebar + topbar + content)
- **Sidebar** — navigation links, org branding, usage progress bar
- **Topbar** — breadcrumbs, upgrade button, user menu

### UI
- **Button** — variants: default, secondary, ghost, destructive
- **Card** — container with padding and border
- **Input** — text input with optional icon
- **Badge** — tones: primary, success, warn, neutral
- **StatCard** — label, value, percentage progress
- **UsageChart** — daily usage bar chart
- **VideoThumb** — thumbnail with duration overlay

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Start the dev server:
   ```bash
   pnpm dev
   ```

3. Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL |
