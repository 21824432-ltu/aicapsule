// server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const capsulesRoutes = require("./routes/capsules");
const { requireAuth } = require("./middleware/requireAuth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

// In development, frontend (5173) and backend (3001) are different origins,
// so CORS with credentials is needed. In production we serve the frontend
// build from this same Express app (see below), so this mostly matters
// for local dev.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Public health check (Section 5) — must stay public, no auth required.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// OAuth login/callback/logout/me routes (public — they establish the session)
app.use("/", authRoutes);

// Protected capsule CRUD — every route here requires a valid JWT.
app.use("/api/capsules", requireAuth, capsulesRoutes);

// --- Serve the React build in production ---
// Recommended by the spec (Section 8): serve frontend + backend from the
// same deployed app/URL to avoid cross-origin cookie complications.
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));

// Any non-API route falls through to the React app (client-side routing
// for "/", "/login", "/dashboard").
app.get(/^(?!\/api|\/auth|\/login|\/logout).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next(); // dist not built yet (e.g. during local backend-only dev)
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`AI Capsule backend listening on http://localhost:${PORT}`);
});
