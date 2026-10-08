import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dbDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(dbDir, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
