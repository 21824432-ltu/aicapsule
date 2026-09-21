// routes/auth.js
// GitHub OAuth login flow. On success, Express issues its OWN application
// JWT (not the GitHub access token) and stores it in a Secure, HttpOnly
// cookie named "token", per Assignment 3 Section 9.

const express = require("express");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  JWT_SECRET,
  FRONTEND_URL, // where to redirect after login, e.g. the deployed app's own origin
} = process.env;

// GET /login -> redirect the browser to GitHub's OAuth authorize screen
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user", // we only need the user's profile, not repo access
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GET /auth/github/callback -> GitHub redirects here with a ?code=...
router.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing OAuth code from GitHub.");
  }

  try {
    // Step 1: exchange the temporary code for a GitHub access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      }
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.status(401).send("GitHub OAuth login failed.");
    }

    // Step 2: use the GitHub access token to fetch the user's profile.
    // This access token is used ONLY here, once, to identify the user.
    // It is never stored or sent to the frontend.
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "AI-Capsule-App",
      },
    });
    const githubUser = await userResponse.json();

    if (!githubUser || !githubUser.id) {
      return res.status(401).send("Could not retrieve GitHub profile.");
    }

    // Step 3: issue OUR OWN application JWT. This is what Section 9
    // requires — not the GitHub access token.
    const appToken = jwt.sign(
      {
        sub: String(githubUser.id), // stable GitHub user id -> becomes user_id
        login: githubUser.login,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Step 4: store the application JWT in a Secure, HttpOnly cookie
    // named "token", per spec. sameSite "lax" allows the redirect from
    // GitHub back to our own site to still carry the cookie.
    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Step 5: send the user to the protected dashboard.
    res.redirect(`${FRONTEND_URL || ""}/dashboard`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Something went wrong during login.");
  }
});

// POST /logout -> clear the cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ message: "Logged out." });
});

// GET /api/me -> lets the frontend check "am I logged in?" without
// exposing any capsule data. Returns 401 if not authenticated.
router.get("/api/me", (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ login: payload.login });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = router;
