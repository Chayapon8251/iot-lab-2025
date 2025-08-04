import { drizzle as drizzlePgsql } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const drizzle = drizzlePgsql({
  casing: "snake_case",
  connectionString: process.env.DATABASE_URL,
  schema,
});

export default drizzle;
