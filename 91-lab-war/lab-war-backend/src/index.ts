import { Context, Hono, Next } from "hono";
import { gameRouter, websocket } from "./controllers/game";
// import { authRouter } from "./controllers/auth";
import { JwtVariables } from "hono/jwt";
import { cors } from "hono/cors";
import { env } from "hono/adapter";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

const corsMiddleware = (c: Context, next: Next) => {
  const { CORS_ORIGINS } = env<{ CORS_ORIGINS: string }>(c);
  return cors({
    origin: [...CORS_ORIGINS.split(","), "http://localhost:5173"],
  })(c, next);
};
app.use("*", corsMiddleware);

// const jwtMiddleware = (c: Context, next: Next) => {
//   const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
//   return jwt({
//     secret: JWT_SECRET,
//   })(c, next);
// };

// app.use("/auth/me", jwtMiddleware);
// app.use("/games/*", jwtMiddleware);

// app.route("/auth", authRouter);
app.route("/games", gameRouter);

export default {
  fetch: app.fetch,
  websocket,
};
export { app, websocket };
