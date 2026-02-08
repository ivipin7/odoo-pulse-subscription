import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./pool.js";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
  try {
    console.log("Running schema.sql...");
    const schema = fs.readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf-8");
    await db.query(schema);
    console.log("Schema applied.");

    // Seed admin user
    const existing = await db.query("SELECT id FROM users WHERE email = $1", ["admin@example.com"]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash("Admin@123", 10);
      await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'ADMIN')`,
        ["admin@example.com", hash, "Admin", "User"]
      );
      console.log("Admin user seeded: admin@example.com / Admin@123");
    } else {
      console.log("Admin user already exists.");
    }

    // Seed sample tax
    const taxExists = await db.query("SELECT id FROM taxes LIMIT 1");
    if (taxExists.rows.length === 0) {
      await db.query(
        `INSERT INTO taxes (name, tax_computation, amount) VALUES ($1, $2, $3)`,
        ["GST 18%", "PERCENTAGE", 18]
      );
      console.log("Sample tax seeded.");
    }

    // Seed sample recurring plan
    const planExists = await db.query("SELECT id FROM recurring_plans LIMIT 1");
    if (planExists.rows.length === 0) {
      await db.query(
        `INSERT INTO recurring_plans (name, billing_period, billing_interval, description)
         VALUES ($1, $2, $3, $4)`,
        ["Monthly Plan", "MONTHLY", 1, "Standard monthly billing"]
      );
      console.log("Sample recurring plan seeded.");
    }

    console.log("DB initialization complete.");
    process.exit(0);
  } catch (err) {
    console.error("DB init failed:", err);
    process.exit(1);
  }
}

initDb();
