import { Context, Hono, Next } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { nanoid } from "nanoid";
import { SessionService } from "./services/session";
import { cors } from "hono/cors";
import { env } from "hono/adapter";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

const corsMiddleware = (c: Context, next: Next) => {
  const { CORS_ORIGINS } = env<{ CORS_ORIGINS: string }>(c);
  return cors({
    origin: [...CORS_ORIGINS.split(","), "http://localhost:5173"],
  })(c, next);
};
app.use("*", corsMiddleware);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const FONTS = ["ibm-plex-sans-thai", "bai-jamjuree", "anuphan", "trirong"];
const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
const FONT_SIZES = [16, 24, 32, 40, 48, 56, 64, 72];

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const sessionService = SessionService.getInstance();
    const cuid = nanoid();

    return {
      async onOpen(evt, ws) {
        console.log(`[SessionId: ${cuid}] Connection opened`);
        sessionService.append(cuid, ws.raw!);
      },
      onMessage(event, ws) {
        console.log(`[SessionId: ${cuid}] Message received: ${event.data}`);
        sessionService.broadcast(
          JSON.stringify({
            text: (event.data as string).trim().slice(0, 15),
            font: FONTS[Math.floor(Math.random() * FONTS.length)],
            fontWeight: FONT_WEIGHTS[Math.floor(Math.random() * FONT_WEIGHTS.length)],
            fontSize: FONT_SIZES[Math.floor(Math.random() * FONT_SIZES.length)],
          })
        );
      },
      onClose: () => {
        console.log("Connection closed");
        sessionService.remove(cuid);
      },
    };
  })
);

export default {
  fetch: app.fetch,
  websocket,
};
