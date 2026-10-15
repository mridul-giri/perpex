import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const sqlPath = fileURLToPath(
  new URL("../prisma/refresh-continuous-aggregates.sql", import.meta.url),
);

const statements = readFileSync(sqlPath, "utf-8")
  .split("\n")
  .filter((line) => line.trim().startsWith("CALL "));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const client = new Client({ connectionString });
await client.connect();

for (const statement of statements) {
  console.log(`Running: ${statement}`);
  await client.query(statement);
}

await client.end();
console.log("Backfilled candle continuous aggregates.");
