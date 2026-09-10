# Weekly Report Hub

An internal tool for weekly work reporting. Team members submit a structured
report each week; managers review it, approve it or send it back for
correction, and get a dashboard analysing reports across the team.

## Prerequisites

- **Node.js 20+** and npm 10+
- A **PostgreSQL** database. These instructions assume [Neon](https://neon.tech)
  (free tier), but any Postgres works.

## 1. Clone and configure environment variables

```bash
git clone <repository-url>
cd Sysenco
```

Create the two files below and fill in your own values. Neither is committed.

**Create `backend/.env`:**

```ini
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require"
JWT_SECRET="a-long-random-string"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:3000"
PORT=3001
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection. On Neon this is the host containing `-pooler`. |
| `DIRECT_URL` | Direct (unpooled) connection, used by `prisma migrate`. |
| `JWT_SECRET` | Long random string. Generate one: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `FRONTEND_URL` | Origin allowed by CORS, e.g. `http://localhost:3000` |
| `PORT` | API port, default `3001` |
| `GEMINI_API_KEY` | **Optional.** Enables the AI assistant. Free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Leave blank and the widget is hidden. |
| `GEMINI_MODEL` | **Optional.** Defaults to `gemini-2.5-flash`. |

**Create `frontend/.env.local`:**

```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

## 2. Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 3. Set up the database

From `backend/`:

```bash
npx prisma migrate deploy
npx prisma generate
```

## 4. Seed demo data

```bash
npm run db:seed
```

Idempotent - clears every table first, so re-running gives an identical
dataset. Creates 7 users, 5 projects and 26 reports across six weeks.

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

## 5. Run the backend

```bash
cd backend
npm run start:dev             # http://localhost:3001
```

## 6. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev                   # http://localhost:3000
```

Sign in with any account from the table above. Managers land on `/manager`,
team members on `/dashboard`.

## API documentation

With the backend running, Swagger UI is at:
**<http://localhost:3001/api/docs>**
