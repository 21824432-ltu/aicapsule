# AI Capsule — Cloud-Deployed AI Prompt Manager

A full-stack app for saving and managing AI prompts. Built with a React
frontend and a Node/Express backend, using GitHub OAuth to log in and a
JWT (stored in a secure, HttpOnly cookie) to protect the API. Data is
stored in SQLite. Deployed on Render.

---

## 1. Deployed application

- **Public URL:** https://ai-capsule-yta3.onrender.com
- **Cloud platform:** Render (free tier web service)
- **Persistence note:** I'm using SQLite for storage, but on Render's
  free tier the disk isn't persistent — if the service restarts or gets
  redeployed, the database file gets wiped and starts fresh. I explain
  this more in the limitation section below.

---

## 2. Project structure

```
aicapsule/
├── backend/
│   ├── server.js                 Express app - routes, serves the built frontend
│   ├── db.js                      Creates/opens the SQLite db, runs init.sql
│   ├── init.sql                     capsules table schema
│   ├── middleware/requireAuth.js       Checks the JWT cookie on protected routes
│   ├── routes/auth.js                 GitHub OAuth login/callback/logout
│   ├── routes/capsules.js              CRUD routes for capsules
│   └── .env.example                   Example env file (no real secrets in it)
├── frontend/
│   └── src/
│       ├── api.js                    All the fetch() calls to the backend
│       ├── App.jsx                     Routes for /, /login, /dashboard
│       ├── pages/                     HomePage, LoginPage, DashboardPage
│       └── components/                 Header, CapsuleForm
├── package.json                  Root scripts Render uses to build/start
└── README.md
```

## 3. Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Kicks off GitHub OAuth |
| `/dashboard` | Protected | Shows your own capsules |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Get your own capsules |
| `POST /api/capsules` | Protected | Create a capsule |
| `PUT /api/capsules/:id` | Protected | Update a capsule you own |
| `DELETE /api/capsules/:id` | Protected | Delete a capsule you own |

The frontend talks to the backend through `fetch()` calls in
`frontend/src/api.js`. Every request sends `credentials: "include"` so the
browser attaches the HttpOnly `token` cookie automatically — the frontend
never actually touches the JWT itself, it just relies on the cookie being
sent along.

In production the React build is served directly by Express from the same
origin, so there's no cross-origin cookie issue to worry about. Locally,
while running two separate dev servers (Vite on 5173, Express on 3001),
Vite's dev proxy forwards `/api`, `/login`, `/logout` and `/auth` requests
to the backend so the cookie still works the same way during development.

## 4. Running it

### Local dev (two terminals)

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in your own values
npm install
npm start
```
Runs on `http://localhost:3001`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

### Local "production mode" (what actually runs on Render)

From the project root:
```bash
npm run build
npm start
```
This builds the React app and then starts Express serving both the API
and the built frontend from `http://localhost:3001` — same setup as the
deployed version, just running locally.

### On Render

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** set directly in Render's dashboard (see
  Section 6) — not committed anywhere in this repo.

## 5. Database

`backend/init.sql` has the `capsules` table matching what the assignment
brief asked for. `backend/db.js` opens/creates the SQLite file and runs
that schema every time the server starts (it's `CREATE TABLE IF NOT
EXISTS`, so it's safe to run repeatedly without wiping anything that
exists).

For ownership: `user_id` on every capsule is the GitHub user ID pulled
from the verified JWT (`req.user.id`, set in
`middleware/requireAuth.js`). It's never taken from the request body, so
there's no way for someone to fake being a different user by just editing
what they send.

On persistence — this is the main limitation of the setup. Render's free
tier doesn't give you a persistent disk, so the SQLite file gets reset
whenever the service restarts or is redeployed. It's fine for demoing the
app and passing the CRUD/auth checks, but not something I'd use for an
actual production app without swapping to Render's managed Postgres.

## 6. OAuth + JWT

**Provider used:** GitHub OAuth.

**How it works, step by step:**
1. `GET /login` sends the browser to GitHub's OAuth authorize page.
2. GitHub redirects back to `GET /auth/github/callback?code=...`.
3. The backend swaps that code for a GitHub access token, then uses the
   token once to grab the user's GitHub profile (id + username).
4. The backend then signs its **own** JWT using `jsonwebtoken`, with the
   GitHub user id stored as `sub`. This is a completely separate token
   from the GitHub access token — the GitHub token is only used
   momentarily during the callback and is thrown away after that, never
   stored or sent to the frontend.
5. That JWT gets set as a cookie named `token`, marked `HttpOnly`,
   `Secure` (in production) and `SameSite=Lax`.
6. Every `/api/capsules` route runs through
   `middleware/requireAuth.js` first, which reads the `token` cookie and
   verifies it with `jsonwebtoken.verify()`. No cookie, or a cookie that
   fails verification, both get a 401 straight away. If it's valid, the
   decoded `sub` becomes `req.user.id` for that request.

**Environment variables** (real values live in Render's dashboard, not in
this repo — see `.env.example` for the template):

| Variable | What it's for |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth app's client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app's client secret |
| `GITHUB_CALLBACK_URL` | Has to exactly match the callback URL set on the GitHub OAuth app |
| `JWT_SECRET` | Random string used to sign/verify the app's own JWT |
| `FRONTEND_URL` | Where to send the browser after login completes |
| `NODE_ENV` | `production` on Render |
| `PORT` | Set automatically by Render |

## 7. Required cURL tests

Both run against the deployed URL, before submitting:

```bash
curl -i https://ai-capsule-yta3.onrender.com/api/capsules
```
```
HTTP/2 401
content-type: application/json; charset=utf-8
...
{"error":"Unauthorized"}
```

```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-yta3.onrender.com/api/capsules
```
```
HTTP/2 401
content-type: application/json; charset=utf-8
...
{"error":"Unauthorized"}
```

Both come back 401, which is what's required — the first shows the API
won't respond without a token at all, and the second shows it's actually
checking the JWT signature rather than just checking that some cookie
exists.

I also tested this locally during development by signing a JWT with a
different secret than what the server was using — same result, rejected
with a 401.

## 8. AI use

- **Tool:** Claude (Anthropic).
- **What it helped with:** setting up the initial project structure, the
  Express routes, the GitHub OAuth exchange, the JWT middleware, and the
  React pages/components.
- **Problem I found and fixed:** the first version of the ownership check
  on the update/delete routes was comparing IDs in a way that would've
  worked, but I wanted the ownership check to happen as its own explicit
  step rather than being buried inside the SQL query, so it's obvious
  from reading the route what's being enforced and why. I also tested
  this directly by creating two different signed JWTs for two fake users
  and confirming one couldn't touch the other's records.
- **How I verified OAuth/JWT actually worked:** before I had OAuth fully
  wired up, I signed test JWTs manually using the same secret the server
  reads from `.env`, and used those as cookies with curl to check the
  protected routes worked correctly (200 with a valid token, 401 without
  one or with a broken one). Once deployed, I logged in for real through
  GitHub and confirmed the whole flow end-to-end — login, dashboard,
  create/edit/delete, logout, log back in.
- **One decision I made myself:** I chose to serve the React build
  directly from the Express app instead of deploying the frontend and
  backend as two separate services. Mainly because the JWT cookie is
  HttpOnly and tied to a specific origin, so keeping everything on one
  origin avoided having to deal with cross-origin cookie settings.

## 9. Limitation

The biggest limitation is the SQLite storage not being persistent on
Render's free tier — any restart or redeploy wipes the database and it
starts empty again. For this assignment that's an acceptable trade-off
since it's free and still lets me demonstrate the full CRUD and auth flow
properly, but it wouldn't be good enough for a real deployment. The fix
would be switching to Render's managed PostgreSQL (or another persistent
database) instead of a local SQLite file.
