import { drizzle as drizzlePgsql } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const drizzle = drizzlePgsql({
  connection: {
    connectionString: process.env.DATABASE_URL as string,
  },
  casing: "snake_case",
  schema,
});

export default drizzle;
