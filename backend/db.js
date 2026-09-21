// db.js
// Opens (and creates if needed) the SQLite database and runs init.sql.
// NOTE per assignment spec (Section 8): on Render's free tier, the local
// filesystem is ephemeral, so this SQLite file may be reset after a
// restart or redeploy. This is documented in the README as a known
// limitation, not something this code can fix.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "aicapsule.db");
const SCHEMA_PATH = path.join(__dirname, "init.sql");

const db = new Database(DB_PATH);

const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

if (require.main === module) {
  console.log(`Database initialised at ${DB_PATH}`);
}

module.exports = db;
