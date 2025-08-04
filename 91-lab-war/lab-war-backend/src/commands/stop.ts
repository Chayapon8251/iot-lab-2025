import redis from "../db/redis";

async function stop() {
  await redis.set("game-started", "false");
  await redis.set("game-need-update", "true");

  console.log(`[Stop] Game stopped`);
  process.exit(0);
}

stop();
