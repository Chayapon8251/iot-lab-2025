import { jwt } from "hono/jwt";
import { JWT_SECRET } from "./helpers/jwt";

export const authMiddleware = jwt({
  secret: JWT_SECRET,
});
