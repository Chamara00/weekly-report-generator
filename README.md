# Weekly Report Hub

Internal tool for submitting, reviewing and analysing weekly work reports.

- **Team members** submit a structured weekly report (tasks done, tasks planned,
  blockers, achievements, hours by type).
- **Managers** review each report and either approve it or send it back for
  correction, and see a dashboard analysing reports across the team.

## Repository layout

| Path        | What it is                                                        |
| ----------- | ----------------------------------------------------------------- |
| `backend/`  | NestJS + Prisma API. Owns the database, auth and all business rules |
| `frontend/` | Next.js 15 (App Router) UI. Talks to the API over HTTP only         |
| `docs/`     | ER diagram and design notes                                        |

## Stack

**Backend** — NestJS, TypeScript, Prisma, PostgreSQL (Neon), Passport JWT,
bcrypt, class-validator, Swagger, Jest.

**Frontend** — Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Recharts.

## Status

Phase 1: monorepo scaffold + database schema. (Work in progress.)
