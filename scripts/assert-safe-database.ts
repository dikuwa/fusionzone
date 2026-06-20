import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const required = process.argv.includes("--required");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (required) {
    throw new Error("DATABASE_URL is required for this database operation.");
  }
  console.log("[database-safety] DATABASE_URL is not configured; skipping check.");
  process.exit(0);
}

let databaseUrl: URL;
try {
  databaseUrl = new URL(connectionString);
} catch {
  throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
}

const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
const expectedDatabaseName = process.env.EXPECTED_DATABASE_NAME || "fusionzone";

if (databaseName !== expectedDatabaseName) {
  throw new Error(
    `[database-safety] Refusing database operation: expected database "${expectedDatabaseName}", received "${databaseName || "(missing)"}".`,
  );
}

if (!/sslmode=require/.test(databaseUrl.search)) {
  throw new Error("[database-safety] Refusing database operation without sslmode=require.");
}

console.log(
  `[database-safety] Verified isolated target ${databaseUrl.hostname.replace(/^[^.]+/, "***")}/${databaseName} with SSL required.`,
);
