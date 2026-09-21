// routes/capsules.js
// CRUD for prompt capsules. Every route requires a valid JWT (applied in
// server.js). user_id always comes from req.user.id (set by requireAuth
// from the verified JWT) — never from the request body.

const express = require("express");
const router = express.Router();
const db = require("../db");

function validateCapsuleBody(body) {
  const errors = [];
  if (!body.project_name || String(body.project_name).trim() === "") {
    errors.push("project_name is required");
  }
  if (!body.prompt_title || String(body.prompt_title).trim() === "") {
    errors.push("prompt_title is required");
  }
  if (!body.prompt_text || String(body.prompt_text).trim() === "") {
    errors.push("prompt_text is required");
  }
  return errors;
}

// GET /api/capsules -> only the authenticated user's own records
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/capsules -> create, owned by the authenticated user
router.post("/", (req, res) => {
  const errors = validateCapsuleBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.user.id, // owner comes from the verified JWT, not the request body
      project_name,
      prompt_title,
      prompt_version || null,
      prompt_text,
      response_summary || null,
      category || null,
      usefulness || null,
      reviewed ? 1 : 0,
      improved ? 1 : 0,
      screenshot_url || null,
      notes || null
    );

    const created = db
      .prepare("SELECT * FROM capsules WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/capsules/:id -> update, only if owned by the authenticated user
router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ?")
    .get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Capsule not found" });
  }

  // Ownership check: a user must not be able to update another user's record.
  if (existing.user_id !== req.user.id) {
    return res.status(404).json({ error: "Capsule not found" });
  }

  const errors = validateCapsuleBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(", ") });
  }

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  try {
    db.prepare(`
      UPDATE capsules SET
        project_name = ?, prompt_title = ?, prompt_version = ?,
        prompt_text = ?, response_summary = ?, category = ?,
        usefulness = ?, reviewed = ?, improved = ?, screenshot_url = ?,
        notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      project_name,
      prompt_title,
      prompt_version || null,
      prompt_text,
      response_summary || null,
      category || null,
      usefulness || null,
      reviewed ? 1 : 0,
      improved ? 1 : 0,
      screenshot_url || null,
      notes || null,
      req.params.id,
      req.user.id
    );

    const updated = db
      .prepare("SELECT * FROM capsules WHERE id = ?")
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/capsules/:id -> only if owned by the authenticated user
router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ?")
    .get(req.params.id);

  if (!existing || existing.user_id !== req.user.id) {
    return res.status(404).json({ error: "Capsule not found" });
  }

  try {
    db.prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?").run(
      req.params.id,
      req.user.id
    );
    res.json({ deleted: true, id: Number(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
