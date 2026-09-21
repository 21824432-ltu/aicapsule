# Deployment Checklist — Do This Yourself

I can't complete these two steps for you because they require your own
GitHub account and your own cloud account. Everything else in this
project is already built and tested. Follow this in order.

---

## Part A — Register a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:
   - **Application name:** `AI Capsule` (anything is fine)
   - **Homepage URL:** your Render URL once you have it, e.g.
     `https://your-app-name.onrender.com` (you can update this later —
     see step 6 below)
   - **Authorization callback URL:**
     `https://your-app-name.onrender.com/auth/github/callback`
     **This must match exactly** — including `https://`, no trailing
     slash, and the exact path `/auth/github/callback`.
4. Click **"Register application"**.
5. On the app's page, click **"Generate a new client secret"**. Copy both:
   - **Client ID** (visible immediately)
   - **Client Secret** (shown once — copy it now)
6. If you don't know your Render URL yet, register the app first with a
   placeholder, deploy (Part B), get your real `.onrender.com` URL, then
   come back and edit the OAuth App's Homepage URL and Authorization
   callback URL to match it exactly.

Keep the Client ID and Secret somewhere safe — you'll paste them into
Render's environment variables in Part B, step 6. **Never commit these
to GitHub.**

---

## Part B — Deploy to Render

1. Push this project to a GitHub repository first (see the git commands
   at the bottom of this file if you haven't already).
2. Go to https://render.com and sign up / log in (GitHub login is fine).
3. Click **"New +"** → **"Web Service"**.
4. Connect your GitHub account if prompted, then select your repository.
5. Configure the service:
   - **Name:** anything, e.g. `ai-capsule`
   - **Region:** closest to you
   - **Branch:** `main` (or whichever branch has your code)
   - **Root Directory:** leave blank (the root `package.json` handles both
     frontend and backend)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
6. Before clicking "Create Web Service", scroll to **Environment
   Variables** and add:

   | Key | Value |
   |---|---|
   | `GITHUB_CLIENT_ID` | (from Part A, step 5) |
   | `GITHUB_CLIENT_SECRET` | (from Part A, step 5) |
   | `GITHUB_CALLBACK_URL` | `https://your-app-name.onrender.com/auth/github/callback` |
   | `JWT_SECRET` | any long random string — generate one with `openssl rand -base64 32` in your terminal |
   | `FRONTEND_URL` | `https://your-app-name.onrender.com` |
   | `NODE_ENV` | `production` |

   Note: Render assigns your `.onrender.com` subdomain — you'll see the
   exact URL in the Render dashboard once the service is created. If you
   don't know it before the first deploy, deploy once with a best-guess
   value, then update `GITHUB_CALLBACK_URL` and `FRONTEND_URL` to the
   real URL Render gives you, and also update the GitHub OAuth App's
   callback URL to match (Part A, step 6). Redeploy after changing env vars.

7. Click **"Create Web Service"**. Wait for the build/deploy to finish
   (watch the logs — you should see `npm run build` install both
   `backend` and `frontend` dependencies and build the frontend, then
   `AI Capsule backend listening on http://localhost:...` in the start logs).
8. Visit your `.onrender.com` URL. You should see the AI Capsule landing
   page.

---

## Part C — Verify everything before recording your video

Run through this exact list, against your **deployed** URL:

```bash
# 1. Health check — should return {"status":"ok"}
curl https://your-app-name.onrender.com/api/health

# 2. No auth — should return 401
curl -i https://your-app-name.onrender.com/api/capsules

# 3. Fake JWT — should also return 401
curl -i -H "Cookie: token=fake-token-123" https://your-app-name.onrender.com/api/capsules
```

Then in your browser:
4. Go to your deployed URL → click **"Sign in to get started"** → **"Continue with GitHub"**.
5. Approve the GitHub OAuth prompt (first time only).
6. You should land on `/dashboard` and see an empty capsule list.
7. Create a capsule, edit it, delete it — confirm all three work.
8. Refresh the page — confirm your capsule(s) persist (until Render's next restart, per the ephemeral-storage limitation noted in the README).

If all of these pass, you're ready to fill in the bracketed placeholders
in `README.md` (deployed URL, cURL results, AI-use specifics, limitation)
and record your video.

---

## Git commands, if you haven't pushed this project yet

```bash
cd aicapsule
git init
git add .
git status   # double check node_modules, dist, .env, *.db are NOT listed
git commit -m "Initial commit: AI Capsule"
git branch -M main
git remote add origin https://github.com/yourusername/aicapsule.git
git push -u origin main
```
