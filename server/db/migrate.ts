import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const migrationsDir = path.resolve(
  process.cwd(),
  "database/migrations",
);

async function runMigrations() {
  const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password:
      process.env.DB_PASSWORD ||
      (() => {
        throw new Error(
          "DB_PASSWORD environment variable is required.",
        );
      })(),
    database:
      process.env.DB_NAME || "wii_access_portal",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    charset: "utf8mb4",
    multipleStatements: false,
  });

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    if (!fs.existsSync(migrationsDir)) {
      console.log(
        "No database migrations directory found.",
      );
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (migrationFiles.length === 0) {
      console.log("No pending database migrations.");
      return;
    }

    const [appliedRows]: any = await db.query(
      "SELECT migration_name FROM schema_migrations ORDER BY id ASC",
    );

    const applied = new Set(
      (appliedRows || []).map(
        (row: any) => row.migration_name,
      ),
    );

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`? Already applied: ${file}`);
        continue;
      }

      const fullPath = path.join(
        migrationsDir,
        file,
      );

      const sql = fs.readFileSync(
        fullPath,
        "utf8",
      );

      console.log(`? Applying migration: ${file}`);

      // Current migrations contain regular SQL statements only.
      // Split on statement terminators while ignoring empty/comment lines.
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter((statement) => {
          if (!statement) return false;

          const withoutComments = statement
            .replace(
              /^--.*(?:\r?\n|$)/gm,
              "",
            )
            .trim();

          return Boolean(withoutComments);
        });

      for (const statement of statements) {
        await db.query(statement);
      }

      await db.query(
        `
        INSERT INTO schema_migrations
          (migration_name)
        VALUES (?)
        `,
        [file],
      );

      console.log(`? Applied: ${file}`);
    }

    console.log("? Database migrations completed.");
  } finally {
    await db.end();
  }
}

runMigrations().catch((error) => {
  console.error(
    "? Database migration failed:",
    error?.message || error,
  );

  process.exit(1);
});

