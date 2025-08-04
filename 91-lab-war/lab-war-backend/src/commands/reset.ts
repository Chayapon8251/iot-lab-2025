import redis from "../db/redis";
import { defaultTeamData } from "../services/game";

async function reset() {
  console.log(`[Reset] Stopping game...`);
  await redis.set("game-started", "false");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`[Reset] Resetting team data...`);

  for (const team of defaultTeamData) {
    await redis.set(`team-${team.name}-health`, team.health.toString());
    await redis.set(`team-${team.name}-maxHealth`, team.maxHealth.toString());
    await redis.set(`team-${team.name}-active`, team.active.toString());
  }
  await redis.set("teams", JSON.stringify(defaultTeamData));

  console.log(`[Reset] Resetting game states...`);

  await redis.set("game-need-update", "true");

  console.log(`[Reset] Reset complete`);
  process.exit(0);
}

reset();
