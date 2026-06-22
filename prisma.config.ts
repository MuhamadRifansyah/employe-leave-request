import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use DIRECT_URL (session mode, port 5432) for migrations/db push
    // PgBouncer (transaction mode, port 6543) doesn't support DDL
    url: env("DIRECT_URL"),
  },
});
