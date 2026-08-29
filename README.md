# Job Board — Next.js + MongoDB

**Next.js 15 (App Router, TS strict) · MongoDB Atlas via Mongoose 8 · Zod · Tailwind v4 ·
NextAuth (Auth.js v5) · pnpm**

Backend + API is built. The UI is a single placeholder page (`app/page.tsx`) — screens get
added one at a time.

---

## Getting started

```bash
pnpm install
cp .env.example .env.local      # fill in MONGODB_URI + secrets
pnpm seed                       # creates admin@example.com / Admin12345 in the `admins` collection
pnpm dev                        # http://localhost:3000
```

Scripts: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.

`config/env.ts` validates env vars at boot — a missing/malformed value throws immediately and
fails `pnpm build`. See `.env.example`.

---

## The two collections

| Model | Collection | What it is | Login kind |
|---|---|---|---|
| `lib/models/user.model.ts` (`User`) | `users` | website users — name, email, phone, passwordHash, status | `"user"` |
| `lib/models/admin.model.ts` (`Admin`) | `admins` | admin-panel users — name, email, passwordHash, status | `"admin"` |

Fully separate. The access/refresh JWT and the web session carry a `kind` claim so
`authenticate()` knows which collection an identity belongs to.

---

## Structure

```
app/
  page.tsx              the only page (placeholder)
  api/
    auth/[...nextauth]/  NextAuth — web session
    v1/
      auth/               register · login · refresh
      users/              REST: GET list, POST, GET/:id, PUT/:id, DELETE/:id
lib/
  db/mongoose.ts        serverless-safe cached connection
  models/               user.model.ts · admin.model.ts
  validators/           common.ts · auth.validator.ts · user.validator.ts   (Zod — reuse in forms too)
  services/             auth.service.ts · user.service.ts   (logic + DTO mapping)
  api/                  response helpers · error classes · withRoute wrapper
  auth/                 jwt · password · authenticate · guards · nextauth
types/                  api.ts (ApiResponse<T>) · auth.ts · user.ts · admin.ts · next-auth.d.ts
config/env.ts           fail-fast env validation
scripts/seed.ts         create first admin
```

### Request flow

```
HTTP → withRoute()                    lib/api/route-handler.ts
        ├─ connectToDatabase()        cached; never closed here
        ├─ parseJsonBody(req, zod)    Zod validates INPUT → 422
        ├─ requireAuth(req)           Bearer token OR session cookie → AuthContext
        ├─ requireAdmin / requireSelfOrAdmin   → 403
        ├─ service(...)               Mongoose + map to DTO
        └─ jsonOk(dto)                → { success: true, data }
      catch → { success: false, error: { code, message, details? } }
```

---

## Zod vs Mongoose

- **Zod** (`lib/validators`) validates the **HTTP boundary**: body/query shape, coercion,
  unknown-key stripping, per-endpoint rules. Never sees the DB. Failure → `422`.
- **Mongoose schema** (`lib/models`) validates **persistence**: types, `required`, `enum`,
  `unique` indexes. Never sees raw HTTP.
- The `password` in a create request is never stored — only `passwordHash` is.
- Services return plain **DTOs** (`toUserDTO`), never Mongoose documents.

---

## MongoDB / Mongoose

`lib/db/mongoose.ts`: `{ conn, promise }` cache on `globalThis` so warm serverless invocations
and hot reloads reuse one pool. `bufferCommands: false`, `maxPoolSize: 10`. Never disconnected
in a request. Models use `models.X ?? model("X", schema)` for hot-reload safety.

Indexes (in each model, with a reason): `users.email` unique + `users.createdAt`,
`admins.email` unique. In production run `Model.syncIndexes()` in a deploy step.

---

## Auth

One JWT implementation (`lib/auth/jwt.ts`, `jose`): access + refresh, separate secrets,
verified `iss`/`aud`, a `kind` claim.

- **Non-browser clients** → `POST /api/v1/auth/login` → `{ accessToken, refreshToken, expiresIn }`.
  Rotate at `POST /api/v1/auth/refresh`. Stateless — no server-side token store; logout =
  discard the tokens.
- **Web** → NextAuth Credentials provider, calling the same `verifyCredentials`.

One auth check (`lib/auth/authenticate.ts`): `requireAuth(req)` → `{ id, kind, via }`, resolved
from a Bearer token **or** the session cookie.

RBAC (`lib/auth/guards.ts`): `requireAdmin(ctx)`, `requireSelfOrAdmin(ctx, userId)` → `403`.

---

## Adding a new API resource (follow `users`)

For `jobs`:

1. `lib/models/job.model.ts` — `JobDoc` + `Schema<JobDoc, JobModel>`, indexes with a reason,
   `export const Job = models.Job ?? model(...)`.
2. `types/job.ts` — `JobDTO` (string ids, ISO dates, no secrets).
3. `lib/validators/job.validator.ts` — `createJobBodySchema`, `updateJobBodySchema`
   (`.partial().refine(nonEmpty)`), `listJobsQuerySchema` (`listQuerySchema.extend`).
4. `lib/services/job.service.ts` — `toJobDTO()` + `listJobs` / `getJobById` / `createJob` /
   `updateJob` / `deleteJob`. All Mongoose access here; return DTOs only.
5. `app/api/v1/jobs/route.ts` (GET, POST) + `app/api/v1/jobs/[id]/route.ts` (GET, PUT, DELETE):
   wrap in `withRoute`, `parseJsonBody` / `parseQuery`, `requireAuth` + guard, return via
   `jsonOk` / `jsonCreated` / `jsonNoContent`. Add `runtime = "nodejs"` and
   `dynamic = "force-dynamic"`.

---

## Mobile app auth

Never touches NextAuth — uses the token endpoints and the `ApiResponse<T>` contract.

```http
POST /api/v1/auth/login
{ "email": "a@b.com", "password": "…", "kind": "user" }
```
→ `{ success: true, data: { identity, tokens: { accessToken, refreshToken, expiresIn } } }`

Store both tokens in secure storage. Send `Authorization: Bearer <accessToken>` on requests —
the server treats it identically to a web session. On `401`, call `POST /api/v1/auth/refresh`
with the refresh token to get a fresh pair; a `401` there means re-login. Sign out = delete the
stored tokens.

Everything is under `/api/v1`; error shape is always
`{ success: false, error: { code, message, details? } }`.
