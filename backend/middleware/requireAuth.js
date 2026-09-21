// middleware/requireAuth.js
// Verifies the application JWT stored in the HttpOnly "token" cookie.
// Per Assignment 3 Section 9:
//   - No JWT or an invalid JWT -> 401, no protected data returned.
//   - The authenticated user is identified from the VERIFIED JWT only.
//     user_id is never trusted from the request body or query string.

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload.sub is the GitHub user id (a string), set when the JWT was
    // issued in routes/auth.js after a successful OAuth login.
    req.user = { id: String(payload.sub), login: payload.login };
    next();
  } catch (err) {
    // Covers: malformed token, wrong signature, expired token.
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { requireAuth };
