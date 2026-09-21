# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack prompt library: React frontend, Node/Express backend, GitHub
OAuth login, an application JWT stored in a Secure/HttpOnly cookie, and
SQLite storage — deployed to a real public cloud platform.

> ⚠️ **Before this README is complete**, fill in the bracketed placeholders
> below with your actual deployed URL, cloud platform, and testing results.
> A submission with placeholders still in it will not satisfy the assignment.

---

## 1. Deployed application

- **Public URL:** `[https://YOUR-APP-NAME.onrender.com]`
- **Cloud platform:** `[Render / Azure App Service / other — state which]`
- **Persistence note:** This app uses SQLite. On Render's free tier, the
  local filesystem is ephemeral — the database file may be reset after a
  restart or redeploy. This is a known, documented limitation (see
  Section 9 below), not a bug.

---

## 2. Project structure

```
aicapsule/
├── backend/
│   ├── server.js            Express entry point; serves API + built frontend
│   ├── db.js                 Opens/creates SQLite, runs init.sql
│   ├── init.sql                capsules table schema
│   ├── middleware/requireAuth.js   JWT verification middleware
│   ├── routes/auth.js           GitHub OAuth login/callback/logout/me
│   ├── routes/capsules.js        Protected CRUD for prompt capsules
│   └── .env.example             Template for required environment variables
├── frontend/
│   └── src/
│       ├── api.js              fetch() wrapper (credentials: "include")
│       ├── App.jsx               Routes: /, /login, /dashboard
│       ├── pages/               HomePage, LoginPage, DashboardPage
│       └── components/           Header, CapsuleForm
├── package.json              Root build/start scripts (see Section 4)
└── README.md
```

## 3. Required routes (Section 5 of the spec — exact paths, not renamed)

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Starts GitHub OAuth login |
| `/dashboard` | Protected | Authenticated user's records |
| `GET /api/health` | Public | `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read own records |
| `POST /api/capsules` | Protected | Create own record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |

The frontend communicates with Express entirely through `fetch()` calls in
`frontend/src/api.js`, all using `credentials: "include"` so the HttpOnly
`token` cookie is sent automatically on every request. In production, the
frontend build is served by the same Express app at the same origin (see
Section 4), so no cross-origin cookie configuration is needed. In local
development, Vite proxies `/api`, `/login`, `/logout` and `/auth` to the
backend (`frontend/vite.config.js`) so cookies still work correctly across
the two dev ports.

## 4. How to install and run

### Local development (two servers)

**Terminal 1 — backend:**
```bash
cd backend
cp .env.example .env   # then fill in your own values, see Section 6
npm install
npm start
```
Runs on `http://localhost:3001`.

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Open this URL in your browser for local
development — it proxies API/auth calls to the backend.

### Production-style local run (single origin, same as the real deployment)

From the project root:
```bash
npm run build   # installs both frontend & backend deps, builds the React app
npm start        # starts Express, which now also serves the built frontend
```
Open `http://localhost:3001` — the whole app (frontend + API) is served
from that one origin, exactly as it will be on the deployed cloud URL.

### Deployment (Render)

Render is configured with:
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** set in the Render dashboard (see Section 6) —
  never committed to the repository.

## 5. Database

- `backend/init.sql` defines the `capsules` table exactly as specified in
  the assignment brief (Section 6).
- `backend/db.js` opens/creates `backend/aicapsule.db` and runs the schema
  on every server start (`CREATE TABLE IF NOT EXISTS`, safe to re-run).
- **Ownership:** `user_id` is the authenticated user's GitHub ID, taken
  from the verified JWT (`req.user.id` in `middleware/requireAuth.js`) —
  it is never accepted from the request body, so the frontend cannot
  spoof a different owner.
- **Persistence:** SQLite is a single file on the server's local disk.
  On Render's free tier this disk is ephemeral, so data may be lost on
  restart/redeploy. This is a known limitation of the free-tier setup,
  not of the CRUD logic itself — a production deployment would use a
  managed Postgres database instead.

## 6. OAuth, JWT and environment variables

**OAuth provider used:** `[GitHub OAuth / Google OAuth — state which, and
why, if you used the Google fallback]`

**Flow:**
1. `GET /login` redirects the browser to GitHub's OAuth authorize screen.
2. GitHub redirects back to `GET /auth/github/callback?code=...`.
3. The backend exchanges that code for a GitHub access token, then uses
   it once to fetch the user's GitHub profile (id + login).
4. The backend issues its **own** application JWT (`jsonwebtoken`,
   signed with `JWT_SECRET`) containing the GitHub user id as `sub`. This
   is not the GitHub access token — the GitHub token is used only
   momentarily during the callback and is never stored or sent to the
   frontend.
5. That JWT is stored in a cookie named `token`, marked `HttpOnly`,
   `Secure` (in production) and `SameSite=Lax`.
6. Every request to `/api/capsules/*` passes through
   `middleware/requireAuth.js`, which reads `req.cookies.token`, verifies
   it with `jsonwebtoken.verify()`, and rejects (401) if it's missing or
   invalid. The verified payload's `sub` becomes `req.user.id`.

**Environment variables required** (see `backend/.env.example` for the
full template — set the real values in Render's dashboard, never in git):

| Variable | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Must exactly match the OAuth App's callback URL |
| `JWT_SECRET` | Random secret used to sign/verify the application JWT |
| `FRONTEND_URL` | Where to redirect after login (the app's own deployed URL) |
| `NODE_ENV` | `production` on the deployed app |
| `PORT` | Set automatically by Render |

## 7. Required cURL tests (Section 9)

Run against the **deployed** URL before submission:

```bash
# Test 1 — no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 — fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

**Results obtained:**
```
[Paste your actual terminal output here after running both commands
against your deployed URL.]
```

*(These were also verified locally during development against a JWT
signed with the wrong/no secret, confirming the middleware rejects both
a missing cookie and a syntactically-invalid token — see Section 9 for
detail on how this was tested.)*

## 8. AI-assisted development

- **Tool used:** Claude (Anthropic).
- **What it helped with:** scaffolding the Express routes, the GitHub
  OAuth exchange flow, the JWT middleware, and the React
  pages/components.
- **One problem found and corrected:** `[Describe something concrete you
  actually fixed — e.g. "the AI-generated version initially compared
  req.body.user_id for ownership checks; I corrected it to use
  req.user.id from the verified JWT instead, since trusting a
  client-supplied user_id would let anyone edit any record."]`
- **How OAuth/JWT/protected-API behaviour was verified:** tested locally
  by signing a valid test JWT with the same secret the server uses (to
  simulate a completed OAuth login without repeatedly clicking through
  GitHub during development), confirming `GET /api/capsules` returns 200
  with it and 401 without it or with a tampered value. Full GitHub OAuth
  login was then tested end-to-end after deployment.
- **How CRUD and ownership were verified:** created two test JWTs for two
  different fake user ids and confirmed user B's requests could not read,
  update or delete user A's capsule (received 404, not the record).
- **One implementation/deployment decision made independently:**
  `[e.g. "I chose to serve the React build directly from the Express app
  instead of deploying frontend and backend separately, specifically to
  avoid cross-origin cookie issues with the HttpOnly JWT cookie."]`

## 9. Known limitation

`[State one honest limitation — e.g. "SQLite storage is not persistent on
Render's free tier; a redeploy or restart may reset all saved capsules.
A production version of this app would use Render's managed PostgreSQL
or another persistent database instead."]`
