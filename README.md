# Weekly Report Hub

An internal tool for weekly work reporting. Team members submit a structured
report each week; managers review it, approve it or send it back for
correction, and get a dashboard analysing reports across the team.

Two roles:

- **TEAM_MEMBER** — writes, edits and submits their own reports. Can never see
  anybody else's.
- **MANAGER** — reads every report, approves or requests changes, manages
  projects, and sees the analytics dashboard. Can never edit report content.

Report lifecycle:

```
DRAFT ──▶ SUBMITTED ──▶ APPROVED
             ▲   │
             │   ▼
       NEEDS_CORRECTION      (repeatable: each round creates a new version)
```

---

## Stack, and why

| Layer | Choice | Why |
| --- | --- | --- |
| API | **NestJS 11 + TypeScript** | Its module/provider/guard model matches the problem: one reusable `RolesGuard`, one global `ValidationPipe`, business rules in injectable services. |
| ORM | **Prisma 6** | Typed queries against a relational schema; the version-history model needs real foreign keys and constraints, not documents. |
| Database | **PostgreSQL (Neon)** | Enums, partial-unique constraints, serverless-friendly pooling. |
| Auth | **Passport JWT + bcrypt** | Nest owns auth end to end and issues the token; no third-party auth service to explain. |
| Validation | **class-validator / class-transformer** | Declarative per-DTO rules, including nested arrays, enforced globally by one pipe. |
| Docs | **@nestjs/swagger** | Generated from the same decorators, so docs cannot drift from the code. |
| UI | **Next.js 15 App Router** | Server components fetch data on the server, where the httpOnly cookie lives. |
| Styling | **Tailwind + shadcn/ui** | Consistent primitives without hand-rolling a design system. |
| Charts | **Recharts** | Composable React charts; the API returns chart-ready aggregates. |
| Tests | **Jest** | Nest's default; the access-control rules are unit-testable against a mocked Prisma client. |
| AI | **Google Gemini** (`@google/genai`) | Function calling lets the assistant reuse the existing services as tools rather than getting its own path to the data. Optional — the app runs fine without a key. |

## Architecture overview

```
┌────────────────────────┐         ┌──────────────────────────┐        ┌────────────┐
│  Next.js (frontend)    │         │  NestJS (backend)        │        │ PostgreSQL │
│                        │  HTTP   │                          │ Prisma │  (Neon)    │
│  server components ────┼────────▶│ JwtAuthGuard ─▶ RolesGuard│───────▶│            │
│  /api/proxy (writes) ──┼────────▶│   ─▶ controller ─▶ service│        │            │
│  middleware (routing)  │ Bearer  │        (ownership rules)  │        │            │
└────────────────────────┘         └──────────────────────────┘        └────────────┘
```

- The JWT lives in an **httpOnly cookie** set by a Next Route Handler. Browser
  JS cannot read it. Server components read it via `cookies()`; client-side
  writes go through `/api/proxy/*`, which attaches the `Authorization` header
  server-side.
- **Prisma is backend-only.** The frontend never touches the database.
- Report **content** is immutable once submitted: status lives on `Report`,
  content lives on `ReportVersion`. The architecture notes and ER diagram are
  in the submission's shared Drive folder.

```
backend/   src/auth  src/users  src/reports  src/review  src/projects  src/dashboard
frontend/  src/app/(app)  src/components  src/lib
```

---

## Prerequisites

- **Node.js 20+** (developed on 24) and npm 10+
- A **PostgreSQL** database. The instructions below assume [Neon](https://neon.tech)
  (free tier), but any Postgres works.
- No Docker required.

## 1. Clone and configure environment variables

```bash
git clone <repository-url>
cd Sysenco
```

Both apps ship an example env file. Copy each one and fill it in — neither
`.env` is committed.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**`backend/.env`** — see [backend/.env.example](backend/.env.example):

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection, used by the running app. On Neon this is the host containing `-pooler`. |
| `DIRECT_URL` | Direct (unpooled) connection, used by `prisma migrate`. Migrations run DDL and cannot go through PgBouncer. |
| `JWT_SECRET` | Long random string. Generate one: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `FRONTEND_URL` | Origin allowed by CORS, e.g. `http://localhost:3000` |
| `PORT` | API port, default `3001` |
| `GEMINI_API_KEY` | **Optional.** Enables the AI assistant. Free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Leave blank and the widget is simply hidden. |
| `GEMINI_MODEL` | **Optional.** Defaults to `gemini-2.5-flash`. |

**`frontend/.env.local`** — see [frontend/.env.example](frontend/.env.example):

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:3001` |

## 2. Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

(The backend's `postinstall` runs `prisma generate`, so the Prisma client is
ready straight after install.)

## 3. Set up the database

From `backend/`:

```bash
npx prisma migrate deploy     # apply existing migrations (use `migrate dev` when changing the schema)
npx prisma generate           # regenerate the client (no-op right after install)
```

Verify with `npx prisma studio` (opens on http://localhost:5555) or:

```bash
npx prisma migrate status
```

## 4. Seed demo data

```bash
npm run db:seed               # or: npx prisma db seed
```

The seed is **idempotent** — it clears every table first, so re-running gives
an identical dataset. It creates 7 users, 5 projects and 26 reports across six
weeks ending with the current one, including reports with genuine multi-version
history and a partially-filled current week.

### Seeded logins

Every account uses the password **`password123`**.

| Name | Email | Role |
| --- | --- | --- |
| Elena Vasquez | `elena.vasquez@example.com` | MANAGER |
| Tom Whitfield | `tom.whitfield@example.com` | MANAGER |
| Priya Raman | `priya.raman@example.com` | TEAM_MEMBER |
| Marcus Bell | `marcus.bell@example.com` | TEAM_MEMBER |
| Sofia Lindqvist | `sofia.lindqvist@example.com` | TEAM_MEMBER |
| Daniel Okafor | `daniel.okafor@example.com` | TEAM_MEMBER |
| Yuki Tanaka | `yuki.tanaka@example.com` | TEAM_MEMBER |

> Sofia has a report awaiting correction — the quickest way to see the
> correction loop. Priya is the deliberately overloaded member in the analytics.

## 5. Run the backend

```bash
cd backend
npm run start:dev             # watch mode, http://localhost:3001
```

Production build:

```bash
npm run build && npm run start:prod
```

Health check: <http://localhost:3001/health>

## 6. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev                   # http://localhost:3000
```

Sign in with any account from the table above. Managers land on `/manager`,
team members on `/dashboard`.

## Running tests

```bash
cd backend
npm test                      # 55 tests: role-based access control, ownership,
                              # the status state machine, review validation and
                              # user administration
npm run test:cov              # with coverage
```

Lint both apps:

```bash
cd backend && npx eslint src
cd ../frontend && npx eslint src
```

## API documentation

With the backend running, Swagger UI is at:

**<http://localhost:3001/api/docs>**

Use the **Authorize** button to paste a token from `POST /auth/login` and the
protected endpoints become callable from the page.

## Features

**Team member** — dashboard with this week's status and a correction callout,
report history with filters, the weekly report form (create/edit, draft vs
submit), and a read-only report view with version history.

**Manager** — analytics dashboard (four metrics, four Recharts visuals, activity
feed), review queue with combinable filters, review page (approve / request
changes), team list and per-member profiles, project CRUD with member
assignment, cross-team week view, and user management.

**AI assistant** (optional) — a manager-only chat widget. Ask *"what is blocking
the team this week?"*, *"who hasn't submitted?"*, *"is anyone overloaded?"*. It
answers with Gemini function calling over the same services the dashboard uses,
so its numbers always match the UI. Hidden entirely when `GEMINI_API_KEY` is
unset.

## Notes

- Public registration always creates a **TEAM_MEMBER**. Roles are assigned by a
  manager on **/manager/users** — that is the only way a MANAGER is created.
- Removing a team member **deactivates** them rather than deleting: `User →
  Report` cascades, so a hard delete would destroy their reporting history.
  Deactivation blocks login immediately (existing tokens included) and keeps
  every report. Hard delete is allowed only for an account that has filed nothing.
- `/settings` is read-only: the API has no profile-update endpoint yet.
- The ER diagram is provided as an image in the submission's Drive folder.
