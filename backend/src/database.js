import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "strategies.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database error:", err);
  } else {
    console.log("Database initialized at", dbPath);
    initializeSchema();
  }
});

// Promisify db methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      audience TEXT NOT NULL,
      tone TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_strategies_created ON strategies(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_stats_metric ON stats(metric, recorded_at DESC);
  `);
}

export async function db_save_strategy(challenge, audience, tone, response) {
  const id = `strat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO strategies (id, challenge, audience, tone, response) VALUES (?, ?, ?, ?, ?)`,
      [id, challenge, audience, tone, response],
      (err) => {
        if (err) reject(err);
        else resolve(id);
      }
    );
  });
}

export async function db_get_strategies(limit = 50, offset = 0) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, challenge, audience, tone, response, created_at FROM strategies ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

export async function db_get_strategy(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, challenge, audience, tone, response, created_at FROM strategies WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export async function db_delete_strategy(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM strategies WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes > 0);
    });
  });
}

export async function db_count_strategies() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM strategies`, (err, row) => {
      if (err) reject(err);
      else resolve(row?.count || 0);
    });
  });
}

export async function db_get_stats() {
  return new Promise((resolve, reject) => {
    const queries = [
      { name: "total", sql: "SELECT COUNT(*) as count FROM strategies" },
      {
        name: "audiences",
        sql: "SELECT audience, COUNT(*) as count FROM strategies GROUP BY audience ORDER BY count DESC",
      },
      {
        name: "tones",
        sql: "SELECT tone, COUNT(*) as count FROM strategies GROUP BY tone ORDER BY count DESC",
      },
      {
        name: "trend",
        sql: `SELECT DATE(created_at) as date, COUNT(*) as count FROM strategies 
              WHERE created_at >= datetime('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date ASC`,
      },
    ];

    const results = {};
    let completed = 0;

    queries.forEach((q) => {
      db.all(q.sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if (q.name === "total") {
            results.total = rows[0]?.count || 0;
          } else if (q.name === "audiences") {
            results.by_audience = rows || [];
          } else if (q.name === "tones") {
            results.by_tone = rows || [];
          } else if (q.name === "trend") {
            results.trend_30days = rows || [];
          }

          completed++;
          if (completed === queries.length) {
            resolve(results);
          }
        }
      });
    });
  });
}

export default db;
