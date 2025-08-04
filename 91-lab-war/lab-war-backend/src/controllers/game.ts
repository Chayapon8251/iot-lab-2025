import { ServerWebSocket } from "bun";
import { createBunWebSocket } from "hono/bun";
import { Hono } from "hono";
import { SessionService } from "../services/session";
import { createId } from "@paralleldrive/cuid2";
import z from "zod";
import redis, { decrementWithLimit, incrementWithLimit } from "../db/redis";
import dayjs = require("dayjs");
import { DEFAULT_MAX_HEALTH } from "../lib/gameVar";
import { getTeamsData } from "../services/game";

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const gameRouter = new Hono();

// WARNING: DO NOT USE THIS SPAGETTI AS A REFERENCE

const userMessageSchema = z.object({
  action: z.enum(["ATTACK"]),
  data: z.object({
    myTeam: z.enum(["A", "B", "C", "D"]),
    team: z.enum(["A", "B", "C", "D"]),
  }),
});

let isGameStarted = false;

const onMessage = async (sessionId: string, message: unknown) => {
  if (!isGameStarted) {
    return;
  }

  const parsedMessage = userMessageSchema.safeParse(JSON.parse(message as string));
  if (!parsedMessage.success) {
    console.log("[SessionId: ", sessionId, "] Invalid message");
    return;
  }

  const { action, data } = parsedMessage.data;

  console.log("[SessionId: ", sessionId, "] Action: ", action);

  // Limit 10 calls per 1 second each sessionId
  const currentTime = dayjs().valueOf();
  const lastCallTime = await redis.get(`last-call-time-${sessionId}`);
  if (lastCallTime) {
    const timeDiff = currentTime - parseInt(lastCallTime);
    if (timeDiff < 100) {
      return;
    }
  }
  await redis.set(`last-call-time-${sessionId}`, currentTime.toString(), "EX", 10);

  // Handle Event

  if (action === "ATTACK") {
    const { myTeam, team } = data;

    const isSameTeam = myTeam === team;

    // If my team is not active, do nothing
    const isMyTeamActive = await redis.get(`team-${myTeam}-active`);
    if (isMyTeamActive === "false") {
      return;
    }
    const isSelectedTeamActive = await redis.get(`team-${team}-active`);
    if (isSelectedTeamActive === "false") {
      return;
    }

    if (isSameTeam) {
      await incrementWithLimit(`team-${myTeam}-health`, 1, DEFAULT_MAX_HEALTH);
      await redis.incr(`team-${myTeam}-heal-count`);
    } else {
      await decrementWithLimit(`team-${team}-health`, 1, 0);
      await redis.incr(`team-${myTeam}-attack-count`);
      await redis.incr(`team-${myTeam}-attack-count->${team}`);
    }
  }

  // Increment global event counter in Redis (atomic, supports multi-instance)
  const currentUnix = dayjs().unix();
  await redis.incr(`global-event-count-${currentUnix}`);
  await redis.expire(`global-event-count-${currentUnix}`, 2);
};

gameRouter.get(
  "/ws",
  upgradeWebSocket((c) => {
    const sessionService = SessionService.getInstance();
    const cuid = createId();

    return {
      async onOpen(evt, ws) {
        console.log(`[SessionId: ${cuid}] Connection opened`);

        sessionService.append(cuid, ws.raw!);

        sessionService.send(
          cuid,
          JSON.stringify({
            action: "UPDATE_TEAMS",
            data: await getTeamsData(),
          })
        );
        sessionService.send(
          cuid,
          JSON.stringify({
            action: "UPDATE_GAME_STARTED",
            data: isGameStarted,
          })
        );
      },
      onMessage(event, ws) {
        onMessage(cuid, event.data);
      },
      onClose: () => {
        console.log("Connection closed");
        sessionService.remove(cuid);
      },
    };
  })
);

const updateTeamsData = async () => {
  const teams = await getTeamsData();
  for (const team of teams) {
    const currentHealth = await redis.get(`team-${team.name}-health`);
    if (!currentHealth) {
      await redis.set(`team-${team.name}-health`, DEFAULT_MAX_HEALTH.toString());
    }
    const currentMaxHealth = await redis.get(`team-${team.name}-maxHealth`);
    if (!currentMaxHealth) {
      await redis.set(`team-${team.name}-maxHealth`, DEFAULT_MAX_HEALTH.toString());
    }
    const currentIsActive = await redis.get(`team-${team.name}-active`);
    if (!currentIsActive && currentHealth) {
      await redis.set(`team-${team.name}-active`, parseInt(currentHealth) > 0 ? "true" : "false");
    }

    if (currentHealth && currentMaxHealth) {
      const currentHealthNumber = parseInt(currentHealth);
      const currentMaxHealthNumber = parseInt(currentMaxHealth);
      if (currentHealthNumber <= 0) {
        team.active = false;
        await redis.set(`team-${team.name}-active`, "false");
      }
      team.health = currentHealthNumber;
      team.maxHealth = currentMaxHealthNumber;
    }
  }
  await redis.set("teams", JSON.stringify(teams));

  SessionService.getInstance().broadcast(
    JSON.stringify({
      action: "UPDATE_TEAMS",
      data: teams,
    })
  );

  const currentIsGameStarted = (await redis.get("game-started")) === "true";
  if (currentIsGameStarted !== isGameStarted) {
    isGameStarted = currentIsGameStarted;
    SessionService.getInstance().broadcast(
      JSON.stringify({
        action: "UPDATE_GAME_STARTED",
        data: isGameStarted,
      })
    );
  }
};

const updateGlobalEventCount = async () => {
  // get all keys start with global-event-count-
  const keys = await redis.keys("global-event-count-*");
  const counts = await Promise.all(
    keys.map(async (key) => {
      const count = await redis.get(key);
      return { key, count };
    })
  );
  const totalCount = counts.reduce((acc, curr) => acc + parseInt(curr.count || "0"), 0);
  const averageCount = totalCount / counts.length || 0;

  SessionService.getInstance().broadcast(
    JSON.stringify({
      action: "UPDATE_GLOBAL_EVENT_COUNT",
      data: Math.ceil(averageCount),
    })
  );
};

// Update Teams Data every 1 second and broadcast to all clients
setInterval(updateTeamsData, 1000);
setInterval(updateGlobalEventCount, 1000);

export { gameRouter, websocket };
